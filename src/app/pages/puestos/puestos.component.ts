import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EmpleadosService } from '../../services/empleados.service';
import { Puesto } from '../../interfaces/puesto.interface';

type TipoToast = 'exito' | 'error' | 'advertencia';
type FiltroCantidad = 'todos' | 'con' | 'sin';

@Component({
  selector: 'app-puestos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './puestos.component.html',
  styleUrl: './puestos.component.css'
})
export class PuestosComponent implements OnInit, OnDestroy {

  private servicio = inject(EmpleadosService);

  // Información

  puestos: Puesto[] = [];

  cargando = false;
  guardando = false;
  cambiando = false;

  // Formulario

  mostrarFormulario = false;
  editandoId: number | null = null;
  nombrePuesto = '';

  // Cambio de estado

  puestoPorCambiar: Puesto | null = null;

  // Filtros

  filtroActivas = true;
  filtroInactivas = true;

  filtroPersonal: FiltroCantidad = 'todos';
  filtroBajas: FiltroCantidad = 'todos';

  // Notificaciones

  mensajeToast = '';
  tipoToast: TipoToast = 'exito';

  private temporizador:
    ReturnType<typeof setTimeout> | null = null;

  // Inicialización

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
    }
  }

  // Filtrar puestos

  get puestosFiltrados(): Puesto[] {

    return this.puestos.filter(puesto => {

      // Estado del área

      const cumpleEstado =
        (this.filtroActivas && puesto.Activo) ||
        (this.filtroInactivas && !puesto.Activo);

      // Personal asignado

      const totalPersonal = puesto.PersonalActivo + puesto.PersonalInactivo;

      let cumplePersonal = true;

      if (this.filtroPersonal === 'con') {
        cumplePersonal = totalPersonal > 0;
      }

      if (this.filtroPersonal === 'sin') {
        cumplePersonal = totalPersonal === 0;
      }

      // Historial de bajas

      let cumpleBajas = true;

      if (this.filtroBajas === 'con') {
        cumpleBajas = puesto.CantidadBajas > 0;
      }

      if (this.filtroBajas === 'sin') {
        cumpleBajas = puesto.CantidadBajas === 0;
      }

      // Resultado de todos los filtros

      return (cumpleEstado && cumplePersonal && cumpleBajas);

    });
  }


// Seleccionar estado desde los botones

seleccionarEstadoPuesto(
  estado: 'todos' | 'activo' | 'inactivo'
): void {

  this.filtroActivas =
    estado === 'todos' || estado === 'activo';

  this.filtroInactivas =
    estado === 'todos' || estado === 'inactivo';
}


  // Validar casillas de estado

  cambiarFiltroEstado(): void {

    if (!this.filtroActivas && !this.filtroInactivas) {

      this.filtroActivas = true;
      this.filtroInactivas = true;

      this.toast(
        'Selecciona al menos un estado.',
        'advertencia'
      );

    }
  }

  // Limpiar filtros

  limpiarFiltros(): void {

    this.filtroActivas = true;
    this.filtroInactivas = true;

    this.filtroPersonal = 'todos';
    this.filtroBajas = 'todos';
  }

  // Total de áreas

  get areasTotales(): number {
    return this.puestos.length;
  }

  // Áreas activas

  get areasActivas(): number {
    return this.puestos.filter(
      puesto => puesto.Activo
    ).length;
  }

  // Áreas inactivas

  get areasInactivas(): number {
    return this.puestos.filter(
      puesto => !puesto.Activo
    ).length;
  }

  // Personal activo total

  get personalActivoTotal(): number {

    return this.puestos.reduce(
      (total, puesto) => total + puesto.PersonalActivo,
      0
    );
  }

  // Personal inactivo total

  get personalInactivoTotal(): number {

    return this.puestos.reduce(
      (total, puesto) => total + puesto.PersonalInactivo,
      0
    );
  }

  // Bajas históricas totales

  get bajasHistoricas(): number {

    return this.puestos.reduce(
      (total, puesto) => total + puesto.CantidadBajas,
      0
    );
  }

  // Total de personal por puesto

  obtenerTotalPersonal(puesto: Puesto): number {

    return (
      puesto.PersonalActivo +
      puesto.PersonalInactivo
    );
  }

  // Consultar puestos

  cargar(): void {

    this.cargando = true;

    this.servicio.obtenerPuestos().subscribe({

      next: (datos: Puesto[]) => {

        this.puestos = datos;
        this.cargando = false;

      },

      error: (error: HttpErrorResponse) => {

        this.cargando = false;

        console.error(
          'Error al consultar puestos:',
          error
        );

        this.toast(
          'No se pudieron consultar los puestos.',
          'error'
        );

      }

    });
  }

  // Nuevo puesto

  nuevo(): void {

    this.editandoId = null;
    this.nombrePuesto = '';
    this.mostrarFormulario = true;
  }

  // Editar puesto

  editar(puesto: Puesto): void {

    this.editandoId = puesto.PuestoID;
    this.nombrePuesto = puesto.NombrePuesto;
    this.mostrarFormulario = true;
  }

  // Cancelar formulario

  cancelar(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
    this.editandoId = null;
    this.nombrePuesto = '';
  }

  // Guardar puesto

  guardar(): void {

    if (this.guardando) {
      return;
    }

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

  // Solicitar cambio de estado

  solicitarCambio(puesto: Puesto): void {

    this.puestoPorCambiar = puesto;
  }

  // Cancelar cambio de estado

  cancelarCambio(): void {

    if (!this.cambiando) {
      this.puestoPorCambiar = null;
    }
  }

  // Confirmar cambio de estado

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

  // Mostrar notificación

  toast(
    mensaje: string,
    tipo: TipoToast = 'exito'
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

  // Cerrar notificación

  cerrarToast(): void {

    this.mensajeToast = '';

    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
    }

    this.temporizador = null;
  }

}
