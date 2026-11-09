
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { empleado } from '../interfaces/empleado.interface';
import { Puesto } from '../interfaces/puesto.interface';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private url = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  obtenerEmpleados(): Observable<empleado[]> {
    return this.http.get<empleado[]>(`${this.url}/empleados`);
  }

  obtenerPuestos(): Observable<Puesto[]> {
    return this.http.get<Puesto[]>(`${this.url}/puestos`);
  }

  guardarEmpleado(datos: empleado): Observable<any> {
    return this.http.post(`${this.url}/empleados`, datos);
  }

  actualizarEmpleado(id: number, datos: empleado): Observable<any> {
    return this.http.put(`${this.url}/empleados/${id}`, datos);
  }

  eliminarEmpleado(id: number): Observable<any> {
    return this.http.delete(`${this.url}/empleados/${id}`);
  }
}
