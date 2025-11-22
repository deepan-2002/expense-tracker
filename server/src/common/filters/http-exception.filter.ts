import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | object =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extract message string if it's an object
    if (typeof message === 'object' && message !== null) {
      const messageObj = message as any;
      message = messageObj.message || messageObj.error || JSON.stringify(message);
    }

    // Ensure message is a string
    const errorMessage = typeof message === 'string' ? message : 'Internal server error';

    this.logger.error(
      `[${request.method}] ${request.url} -> ${errorMessage}`,
    );

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message: errorMessage,
    });
  }
}
