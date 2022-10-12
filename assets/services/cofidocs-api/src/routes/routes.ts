import { Request, Response } from 'express';
import { DocumentController } from '../controllers/documentsController';

export class Routes {
  public documentController: DocumentController = new DocumentController();

  public routes(app): void {
    // Routes for app health check
    app.route('/').get((req: Request, res: Response) => {
      res.header({ 'Cache-Control': 'no-store' });
      res.status(200).send({
        message: 'GET request Successful, CoFiDocs Service is Up & Running'
      });
    });

    app.route('/api/cofidocs').get((req: Request, res: Response) => {
      res.header({ 'Cache-Control': 'no-store' });
      res.status(200).send({
        message: 'GET request Successful, CoFiDocs Service is Up & Running'
      });
    });

    // document
    // POST endpoint
    app.route('/api/cofidocs/document').post(this.documentController.uploadDocument);

    // get Document by Document File name
    app.route('/api/cofidocs/document/:fileName').get(this.documentController.getDocumentByName);
  }
}
