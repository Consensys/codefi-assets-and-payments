export default interface Environment {
  DB_ADMIN_USER: string
  DB_ADMIN_PASSWORD: string
  DB_USERNAME: string
  DB_PASSWORD: string
  DB_DATABASE_NAME: string
  DB_HOST: string
  DB_PORT?: string
  DB_EXTENSIONS?: string
}
