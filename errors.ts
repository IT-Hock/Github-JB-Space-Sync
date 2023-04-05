import * as Restify from 'restify';

export class ErrorHandler {
    constructor(server:Restify.Server) {
        server.on(`restifyError`, this.defaultErrorHandler);
    }
    
    defaultErrorHandler(req:Restify.Request, res:Restify.Response, err:Error, callback:any) {
        console.error(err);
        return callback();
    }
}