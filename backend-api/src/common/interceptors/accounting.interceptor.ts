import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class AccountingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest();
    const res = httpCtx.getResponse();
    
  
    if (!req) {
      return next.handle();
    }

    const startTime = Date.now();
    const method = req.method || 'UNKNOWN';
    const url = req.url || 'UNKNOWN';
    const ip = req.ip || httpCtx.getRequest()?.connection?.remoteAddress || '127.0.0.1';

    return next.handle().pipe(
      tap((data) => {
        const statusCode = res ? res.statusCode : 200;
        this.writeAuditTrail(method, url, ip, req.user, statusCode, startTime, 'SUCCESS');
      }),
      catchError((err) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : 500;
        const errorMessage = err?.message || (typeof err === 'string' ? err : 'Internal Server Error');
        this.writeAuditTrail(method, url, ip, req.user, statusCode, startTime, `ERROR: ${errorMessage}`);
        return throwError(() => err);
      }),
    );
  }

  private writeAuditTrail(method: string, url: string, ip: string, user: any, statusCode: number, startTime: number, status: string) {
    const duration = Date.now() - startTime;
    const logData = {
      project: 'ECO-SMART',
      timestamp: new Date().toISOString(),
      operatorId: user ? (user.sub || user.id) : 'GUEST_USER',
      username: user ? user.username : 'UNAUTHORIZED',
      role: user ? user.role : 'NONE',
      transaction: `${method} ${url}`,
      statusCode,
      latency: `${duration}ms`,
      clientIp: ip,
      status
    };
    
    console.log(`[ECO-SMART ACCOUNTING]`, JSON.stringify(logData));
  }
}