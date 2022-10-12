const fs = require("fs");
var inquirer = require("inquirer");
const process = require("process");
const execa = require("execa");

async function createCert(certL, keyL, tenant) {
  try {
    await fs.promises.access("./.cert");
  } catch (error) {
    console.log("Missing .cert folder, creating now");
    await execa("mkdir", ["-p", ".cert"], { stdio: "inherit" });
    console.log("Folder created");
  }
  try {
    return execa("mkcert", [
      "-install",
      "-key-file",
      keyL,
      "-cert-file",
      certL,
      tenant,
    ]);
  } catch (error) {
    return Promise.reject(
      `Error calling "mkcert", please make sure that you have "mkcert" and "nss" installed (see README.md) \n\n ${JSON.stringify(
        error,
      )}`,
    );
  }
}

async function handleCerts(certL, keyL, tenant) {
  try {
    await fs.promises.access(certL);
    await fs.promises.access(keyL);
  } catch (error) {
    await inquirer
      .prompt([
        {
          type: "confirm",
          message: "Missing certificates. Create new?",
          name: "createCerts",
        },
      ])
      .then(async (answers) => {
        if (answers.createCerts) {
          return await createCert(certL, keyL, tenant);
        } else {
          return Promise.reject("Cert creation rejected");
        }
      })
      .catch((e) => {
        return Promise.reject(e);
      });
  }
  return Promise.resolve(true);
}

async function handleTenatAddress(tenantToUse, port) {
  if (tenantToUse) {
    return Promise.resolve([tenantToUse, port || 3000]);
  }
  const tenConf = await inquirer.prompt([
    {
      name: "tenant",
      type: "list",
      message: "No tenant provided. Please chose tenant:",
      choices: [
        "development-local.assets-paris-dev.codefi.network",
        "ubs-impact.assets-paris-demo.codefi.network",
        "ubs-bik.assets-paris-demo.codefi.network",
        "custom",
      ],
    },
    {
      name: "custom",
      type: "input",
      message: "Enter tenant url:",
      when: (answers) => answers.tenant === "custom",
    },
    {
      name: "port",
      type: "list",
      message: "Chose port (for 443 you need to run this command with sudo):",
      choices: [3000, 443, 80, 3001, 3002, 3003, 3004, 3005],
    },
  ]);
  return Promise.resolve([tenConf.custom || tenConf.tenant, tenConf.port]);
}

async function handleHostsFile(tenantToUse) {
  let entry = "";
  try {
    entry = await execa("grep", [tenantToUse, "/etc/hosts"], {
      stdio: "inherit",
    });
  } catch (error) {
    try {
      console.log("Adding entry to /etc/hosts");
      await execa.command(
        `sudo -- sh -c "echo '127.0.0.1 ${tenantToUse}' >> /etc/hosts"`,
        { shell: true, stdio: "inherit" },
      );
    } catch (error) {
      console.error(error);
      process.exit(error);
    }
    console.log("Entry added");
    await execa.command("cat /etc/hosts", { shell: true, stdio: "inherit" });
    return Promise.resolve();
  }
  console.log("Entry found in /etc/hosts");
  return Promise.resolve();
}

const main = async (tenant, port) => {
  let [tenantToUse, portToUse] = await handleTenatAddress(tenant, port);

  console.log(`${tenantToUse}:${portToUse}`);

  const certLocation = `./.cert/${tenantToUse}_cert.pem`;
  const keyLocation = `./.cert/${tenantToUse}_key.pem`;

  handleCerts(certLocation, keyLocation, tenantToUse)
    .then(async (res) => {
      await handleHostsFile(tenantToUse);
      const domain = tenantToUse.split(".");
      if (domain.length < 4) {
        console.error("Invalid tenant url");
        process.exit("Invalid tenant url");
      }
      const appDomain = domain.splice(1).join(".");
      execa.command("react-scripts start", {
        stdio: "inherit",
        env: {
          ...process.env,
          HOST: tenantToUse,
          PORT: portToUse,
          HTTPS: true,
          SSL_CRT_FILE: certLocation,
          SSL_KEY_FILE: keyLocation,
          REACT_APP_DOMAIN_NAME: appDomain,
          REACT_APP_APP_URL: `https://${appDomain}`,
        },
      });
    })
    .catch((error) => {
      console.error(error);
      process.exit(error);
    });
};

const arguments = process.argv.splice(2);
main(arguments[0], arguments[1]);
