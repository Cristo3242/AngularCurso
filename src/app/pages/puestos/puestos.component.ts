
import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { EmpleadosService } from '../../services/empleados.service';
import { Puesto } from '../../interfaces/puesto.interface';

@Component({
  selector: 'app-puestos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './puestos.component.html',
  styleUrl: './puestos.component.css'
})
export class PuestosComponent implements OnInit, OnDestroy {

  private servicio = inject(EmpleadosService);

  puestos: Puesto[] = [];

  // FILTROS DE PUESTOS
  mostrarFiltros = false;

// Estado del área
filtroActivas = true;
filtroInactivas = true;

// Personal: todos, con personal o sin personal
filtroPersonal: 'todos' | 'con' | 'sin' = 'todos';

// Bajas históricas: todas, con bajas o sin bajas
filtroBajas: 'todos' | 'con' | 'sin' = 'todos';

  cargando = false;
  guardando = false;
  cambiando = false;

  mostrarFormulario = false;
  editandoId: number | null = null;
  nombrePuesto = '';

  puestoPorCambiar: Puesto | null = null;

  mensajeToast = '';
  tipoToast: 'exito' | 'error' | 'advertencia' = 'exito';

  private temporizador:
    ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
    }
  }

  // OBTENER PUESTOS FILTRADOS
  get puestosFiltrados(): Puesto[] {

  return this.puestos.filter(puesto => {

    // Estado del área
    const cumpleEstado =
      (this.filtroActivas && puesto.Activo) ||
      (this.filtroInactivas && !puesto.Activo);

    //  Personal asignado
    const totalPersonal =
      puesto.PersonalActivo + puesto.PersonalInactivo;

    let cumplePersonal = true;

    if (this.filtroPersonal === 'con') {
      cumplePersonal = totalPersonal > 0;
    }

    if (this.filtroPersonal === 'sin') {
      cumplePersonal = totalPersonal === 0;
    }

    //  Historial de bajas
    let cumpleBajas = true;

    if (this.filtroBajas === 'con') {
      cumpleBajas = puesto.CantidadBajas > 0;
    }

    if (this.filtroBajas === 'sin') {
      cumpleBajas = puesto.CantidadBajas === 0;
    }

    // Debe cumplir los tres filtros
    return cumpleEstado &&
           cumplePersonal &&
           cumpleBajas;

  });
}

// CAMBIAR FILTRO DE ESTADO
cambiarFiltroEstado(): void {

  // Evitar que ambas casillas queden desmarcadas
  if (!this.filtroActivas && !this.filtroInactivas) {

    this.filtroActivas = true;
    this.filtroInactivas = true;

    this.toast(
      'Selecciona al menos un estado.',
      'advertencia'
    );
  }
}

// LIMPIAR FILTROS

limpiarFiltros(): void {

  this.filtroActivas = true;
  this.filtroInactivas = true;

  this.filtroPersonal = 'todos';
  this.filtroBajas = 'todos';
}

  get areasTotales(): number {
    return this.puestos.length;
  }

  get areasActivas(): number {
    return this.puestos.filter(p => p.Activo).length;
  }

  get bajasHistoricas(): number {
    return this.puestos.reduce(
      (total, p) => total + p.CantidadBajas,
      0
    );
  }


  // Cantidad de áreas que están inactivas
  get areasInactivas(): number {
    return this.puestos.filter(
      puesto => !puesto.Activo
    ).length;
  }

  // Cantidad total de empleados activos
  get personalActivoTotal(): number {
    return this.puestos.reduce(
      (total, puesto) => total + puesto.PersonalActivo,
      0
    );
  }

  // Cantidad total de empleados inactivos
  get personalInactivoTotal(): number {
    return this.puestos.reduce(
      (total, puesto) => total + puesto.PersonalInactivo,
      0
    );
  }

  // Total de personas asignadas a un puesto
  obtenerTotalPersonal(puesto: Puesto): number {
    return puesto.PersonalActivo + puesto.PersonalInactivo;
  }


  // CONSULTAR PUESTOS

  cargar(): void {
    this.cargando = true;

    this.servicio.obtenerPuestos().subscribe({

      next: (datos: Puesto[]) => {
        this.puestos = datos;
        this.cargando = false;
      },

      error: (error: HttpErrorResponse) => {
        this.cargando = false;

        console.error('Error al consultar puestos:', error);

        this.toast(
          'No se pudieron consultar los puestos.',
          'error'
        );
      }
    });
  }

  // NUEVO PUESTO

  nuevo(): void {
    this.editandoId = null;
    this.nombrePuesto = '';
    this.mostrarFormulario = true;
  }

  // EDITAR PUESTO

  editar(puesto: Puesto): void {
    this.editandoId = puesto.PuestoID;
    this.nombrePuesto = puesto.NombrePuesto;
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.editandoId = null;
    this.nombrePuesto = '';
  }

  // GUARDAR

  guardar(): void {
    if (this.guardando) return;

    const nombre = this.nombrePuesto.trim();

    if (!nombre || nombre.length > 50) {
      this.toast(
        'Escribe un nombre de 1 a 50 caracteres.',
        'advertencia'
      );
      return;
    }

    this.guardando = true;

    const peticion = this.editandoId === null
      ? this.servicio.crearPuesto(nombre)
      : this.servicio.editarPuesto(
        this.editandoId,
        nombre
      );

    peticion.subscribe({

      next: respuesta => {
        this.guardando = false;
        this.cancelar();
        this.cargar();
        this.toast(respuesta.mensaje);
      },

      error: (error: HttpErrorResponse) => {
        this.guardando = false;

        this.toast(
          error.error?.mensaje ||
          'No se pudo guardar el puesto.',
          'error'
        );
      }
    });
  }

  // CAMBIAR ESTADO

  solicitarCambio(puesto: Puesto): void {
    this.puestoPorCambiar = puesto;
  }

  cancelarCambio(): void {
    if (!this.cambiando) {
      this.puestoPorCambiar = null;
    }
  }

  confirmarCambio(): void {
    const puesto = this.puestoPorCambiar;

    if (!puesto || this.cambiando) {
      return;
    }

    this.cambiando = true;

    this.servicio.cambiarEstadoPuesto(
      puesto.PuestoID,
      !puesto.Activo
    ).subscribe({

      next: respuesta => {
        this.cambiando = false;
        this.puestoPorCambiar = null;

        this.cargar();
        this.toast(respuesta.mensaje);
      },

      error: (error: HttpErrorResponse) => {
        this.cambiando = false;
        this.puestoPorCambiar = null;

        this.toast(
          error.error?.mensaje ||
          'No se pudo cambiar el estado.',
          'error'
        );
      }
    });
  }

  // TOAST

  toast(
    mensaje: string,
    tipo: 'exito' | 'error' | 'advertencia' = 'exito'
  ): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
    }

    this.mensajeToast = mensaje;
    this.tipoToast = tipo;

    this.temporizador = setTimeout(() => {
      this.mensajeToast = '';
      this.temporizador = null;
    }, 3500);
  }

  cerrarToast(): void {
    this.mensajeToast = '';

    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
    }

    this.temporizador = null;
  }
}
