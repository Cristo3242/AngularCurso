
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { empleado } from '../../interfaces/empleado.interface';
import { Puesto } from '../../interfaces/puesto.interface';
import { EmpleadosService } from '../../services/empleados.service';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit {

  empleadoEditado: number | null = null;

  
  puestos: Puesto[] = [];
  empleados: empleado[] = [];

  
  nombre: string = '';
  apellidos: string = '';
  fnacimiento: string = '';
  telefono: string = '';
  puestoID: number = 0;

  constructor(private empleadosService: EmpleadosService) {}

  
  ngOnInit() {
    this.cargarEmpleados();
    this.cargarPuestos();
  }

  cargarEmpleados() {
    this.empleadosService.obtenerEmpleados().subscribe({
      next: (datos) => {
        this.empleados = datos;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
      }
    });
  }

  cargarPuestos() {
    this.empleadosService.obtenerPuestos().subscribe({
      next: (datos) => {
        this.puestos = datos;
      },
      error: (error) => {
        console.error('Error al cargar puestos:', error);
      }
    });
  }

  guardarEmpleado() {

    const puesto = this.puestos.find(
      p => p.PuestoID === this.puestoID
    );

    if (
      !this.nombre.trim() ||
      !this.apellidos.trim() ||
      !this.fnacimiento ||
      !this.telefono.trim() ||
      !puesto
    ) {
      alert('Completa todos los campos');
      return;
    }

    const datos: empleado = {
      personalID: this.empleadoEditado ?? 0,
      Nombre: this.nombre.trim(),
      Apellidos: this.apellidos.trim(),
      Fnacimiento: this.fnacimiento,
      Telefono: this.telefono.trim(),
      PuestoID: this.puestoID,
      NombrePuesto: puesto.NombrePuesto
    };

    const peticion = this.empleadoEditado === null
      ? this.empleadosService.guardarEmpleado(datos)
      : this.empleadosService.actualizarEmpleado(
          this.empleadoEditado,
          datos
        );

    peticion.subscribe({
      next: () => {
        this.cargarEmpleados();
        this.limpiarFormulario();
        alert('Empleado guardado correctamente');
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        alert('No se pudo guardar el empleado');
      }
    });
  }

  editarEmpleado(e: empleado) {
    this.empleadoEditado = e.personalID;

    this.nombre = e.Nombre;
    this.apellidos = e.Apellidos;
    this.fnacimiento = e.Fnacimiento;
    this.telefono = e.Telefono;
    this.puestoID = e.PuestoID;
  }

  eliminarEmpleado(id: number) {

    const confirmar = confirm('¿Deseas eliminar el empleado?');

    if (!confirmar) {
      return;
    }

    this.empleadosService.eliminarEmpleado(id).subscribe({
      next: () => {
        this.cargarEmpleados();

        if (this.empleadoEditado === id) {
          this.limpiarFormulario();
        }

        alert('Empleado eliminado correctamente');
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert('No se pudo eliminar el empleado');
      }
    });
  }

  limpiarFormulario() {
    this.nombre = '';
    this.apellidos = '';
    this.fnacimiento = '';
    this.telefono = '';
    this.puestoID = 0;
    this.empleadoEditado = null;
  }
}
