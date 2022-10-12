import S3 from "aws-sdk/clients/s3";

let getS3Bucket = () => {
  return new S3({
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
    region: process.env["AWS_REGION"],
  });
};

// Function to upload file to S3
let uploadFile = async (fileName, mimeType, file): Promise<object> => {
  const bucket = getS3Bucket();

  const params = {
    Bucket: process.env["AWS_S3_BUCKET_NAME"],
    Key: fileName,
    Body: file,
    ContentType: mimeType,
  };

  return new Promise((resolve, reject) => {
    bucket.upload(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Function to get file from S3 bucket
let getFile = async (fileName): Promise<object> => {
  const bucket = getS3Bucket();
  return new Promise((resolve, reject) => {
    bucket.getObject(
      {
        Bucket: process.env["AWS_S3_BUCKET_NAME"],
        Key: fileName,
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            body: data.Body, // File buffer from S3
            fileName,
            contentType: data.ContentType,
          });
        }
      }
    );
  });
};
export { uploadFile, getFile };
