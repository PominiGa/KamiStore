import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API } from './api';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const ehApi = req.url.startsWith(API);
  const ehLogin = req.url.endsWith('/usuario/login');

  const request =
    token && ehApi && !ehLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && ehApi && !ehLogin && token) auth.sessaoExpirada();
      return throwError(() => err);
    }),
  );
};
