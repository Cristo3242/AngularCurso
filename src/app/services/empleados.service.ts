
import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

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
  personalID?: number;
}

export interface Estadisticas {
  areasTotal: number;
  areasActivas: number;
  personalActivo: number;
  personalInactivo: number;
  cantidadBajas: number;
}

export type CampoFiltro =
  | 'todos'
  | 'nomina'
  | 'nombre'
  | 'apellidos';

export type EstadoFiltro =
  | 'todos'
  | 'activo'
  | 'inactivo';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private http = inject(HttpClient);
  private url = 'http://localhost:3000/api';

  // LISTAR EMPLEADOS CON FILTROS

  obtenerEmpleadosPaginados(
    pagina: number,
    limite: number,
    busqueda: string,
    puestoID: number,
    campo: CampoFiltro = 'todos',
    estado: EstadoFiltro = 'todos'
  ): Observable<RespuestaEmpleados> {

    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString())
      .set('busqueda', busqueda)
      .set('puestoID', puestoID.toString())
      .set('campo', campo)
      .set('estado', estado);

    return this.http.get<RespuestaEmpleados>(
      `${this.url}/empleados`,
      { params }
    );
  }

  // ESTADÍSTICAS

  obtenerEstadisticas(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(
      `${this.url}/estadisticas`
    );
  }

  // CONSULTAR PUESTOS

  obtenerPuestos(): Observable<Puesto[]> {
    return this.http.get<Puesto[]>(
      `${this.url}/puestos`
    );
  }

  // CREAR PUESTO

  crearPuesto(
    NombrePuesto: string
  ): Observable<RespuestaMensaje> {

    return this.http.post<RespuestaMensaje>(
      `${this.url}/puestos`,
      { NombrePuesto }
    );
  }

  // EDITAR PUESTO

  editarPuesto(
    id: number,
    NombrePuesto: string
  ): Observable<RespuestaMensaje> {

    return this.http.put<RespuestaMensaje>(
      `${this.url}/puestos/${id}`,
      { NombrePuesto }
    );
  }

  // DAR DE BAJA O REACTIVAR PUESTO

  cambiarEstadoPuesto(
    id: number,
    Activo: boolean
  ): Observable<RespuestaMensaje> {

    return this.http.patch<RespuestaMensaje>(
      `${this.url}/puestos/${id}/estado`,
      { Activo }
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

  // ACTUALIZAR EMPLEADO

  actualizarEmpleado(
    id: number,
    datos: empleado
  ): Observable<RespuestaMensaje> {

    return this.http.put<RespuestaMensaje>(
      `${this.url}/empleados/${id}`,
      datos
    );
  }

  // BAJA Y REACTIVACIÓN DE PERSONAL

  cambiarEstadoEmpleado(
    id: number,
    Activo: boolean,
    Motivo: string = ''
  ): Observable<RespuestaMensaje> {

    return this.http.patch<RespuestaMensaje>(
      `${this.url}/empleados/${id}/estado`,
      { Activo, Motivo }
    );
  }

  // EXPEDIENTE

  obtenerEmpleadoPorId(
    id: number
  ): Observable<empleado> {

    return this.http.get<empleado>(
      `${this.url}/empleados/${id}`
    );
  }

  // SUBIR O REEMPLAZAR FOTOGRAFÍA

  subirFoto(
    id: number,
    foto: File
  ): Observable<RespuestaMensaje> {

    const formData = new FormData();
    formData.append('foto', foto);

    return this.http.post<RespuestaMensaje>(
      `${this.url}/empleados/${id}/foto`,
      formData
    );
  }

  // URL DE FOTOGRAFÍA

  obtenerUrlFoto(id: number): string {
    return `${this.url}/empleados/${id}/foto`;
  }

  // ELIMINAR SOLAMENTE LA FOTOGRAFÍA

  eliminarFoto(
    id: number
  ): Observable<RespuestaMensaje> {

    return this.http.delete<RespuestaMensaje>(
      `${this.url}/empleados/${id}/foto`
    );
  }
}
