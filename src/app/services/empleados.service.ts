
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { empleado } from '../interfaces/empleado.interface';
import { Puesto } from '../interfaces/puesto.interface';

export interface RespuestaEmpleados {
  empleados: empleado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface RespuestaRegistro {
  personalID: number;
}

export interface RespuestaMensaje {
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private readonly http = inject(HttpClient);

  private readonly url = 'http://localhost:3000/api';

  // CONSULTAR EMPLEADOS CON FILTROS Y PAGINACIÓN

  obtenerEmpleadosPaginados(
    pagina: number,
    limite: number,
    busqueda: string,
    puestoID: number
  ): Observable<RespuestaEmpleados> {

    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString())
      .set('busqueda', busqueda)
      .set('puestoID', puestoID.toString());

    return this.http.get<RespuestaEmpleados>(
      `${this.url}/empleados`,
      { params }
    );
  }

  // CONSULTAR PUESTOS

  obtenerPuestos(): Observable<Puesto[]> {
    return this.http.get<Puesto[]>(
      `${this.url}/puestos`
    );
  }

  // REGISTRAR EMPLEADO

  
guardarEmpleado(
  datos: empleado
): Observable<RespuestaRegistro> {

  return this.http.post<RespuestaRegistro>(
    `${this.url}/empleados`,
    datos
  );
}

actualizarEmpleado(
  id: number,
  datos: empleado
): Observable<RespuestaRegistro> {

  return this.http.put<RespuestaRegistro>(
    `${this.url}/empleados/${id}`,
    datos
  );
}


  // CONSULTAR DETALLE DE EMPLEADO

  obtenerEmpleadoPorId(
    id: number
  ): Observable<empleado> {

    return this.http.get<empleado>(
      `${this.url}/empleados/${id}`
    );
  }

  // ELIMINAR EMPLEADO

  eliminarEmpleado(
    id: number
  ): Observable<RespuestaMensaje> {

    return this.http.delete<RespuestaMensaje>(
      `${this.url}/empleados/${id}`
    );
  }

  // SUBIR FOTOGRAFÍA DEL EMPLEADO

  subirFoto(
    id: number,
    archivo: File
  ): Observable<RespuestaMensaje> {

    const formData = new FormData();

    formData.append('foto', archivo);

    return this.http.post<RespuestaMensaje>(
      `${this.url}/empleados/${id}/foto`,
      formData
    );
  }

  // OBTENER URL DE FOTOGRAFÍA

  obtenerUrlFoto(id: number): string {
    return `${this.url}/empleados/${id}/foto`;
  }



eliminarFoto(id: number): Observable<RespuestaMensaje> {
  return this.http.delete<RespuestaMensaje>(
    `${this.url}/empleados/${id}/foto`
  );
}



}
