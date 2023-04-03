import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { Response as ExpressResponse } from 'express';

@Injectable()
export class ResponseAddContentDispositionAndContentTypeInterceptor implements NestInterceptor {
    intercept(context:ExecutionContext, next:CallHandler): Observable<any> {
        const ResponseObj:ExpressResponse = context.switchToHttp().getResponse();
        ResponseObj.setHeader('Content-Disposition', `attachment; filename="archive.zip"`);
        ResponseObj.setHeader('Content-Type', 'application/zip');
        return next.handle();
    }
}