
import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { empleado } from '../../interfaces/empleado.interface';
import { EmpleadosService } from '../../services/empleados.service';

@Component({
  selector: 'app-empleado-detalle',
  standalone: true,
  imports: [],
  templateUrl: './empleado-detalle.component.html',
  styleUrl: './empleado-detalle.component.css'
})
export class EmpleadoDetalleComponent
  implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicio = inject(EmpleadosService);

  empleado: empleado | null = null;

  cargando = true;
  mensajeError = '';

  fotoDisponible = true;
  versionFoto = 0;

  fotoSeleccionada: File | null = null;
  vistaPreviaFoto: string | null = null;

  subiendoFoto = false;
  confirmarEliminarFoto = false;
  eliminandoFoto = false;

  mensajeToast = '';
  tipoToast: 'exito' | 'error' = 'exito';

  private temporizador:
    ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.cargando = false;
      this.mensajeError = 'ID inválido.';
      return;
    }

    this.servicio.obtenerEmpleadoPorId(id).subscribe({

      next: (datos: empleado) => {
        this.empleado = datos;
        this.cargando = false;
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar expediente:', error);

        this.mensajeError =
          error.error?.mensaje ||
          'No se pudo cargar el expediente.';

        this.cargando = false;
      }
    });
  }

  // URL CON VERSIÓN PARA EVITAR CACHÉ

  obtenerUrlFoto(): string {
    if (!this.empleado) {
      return '';
    }

    return `${this.servicio.obtenerUrlFoto(
      this.empleado.personalID
    )}?v=${this.versionFoto}`;
  }

  // SELECCIONAR FOTO

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    if (
      !['image/jpeg', 'image/png'].includes(archivo.type) ||
      archivo.size > 3 * 1024 * 1024
    ) {
      this.mostrarToast(
        'Solo JPG o PNG, máximo 3 MB.',
        'error'
      );

      input.value = '';
      return;
    }

    this.fotoSeleccionada = archivo;
    this.vistaPreviaFoto = null;

    const lector = new FileReader();

    lector.onload = () => {
      if (
        this.fotoSeleccionada === archivo &&
        typeof lector.result === 'string'
      ) {
        this.vistaPreviaFoto = lector.result;
      }
    };

    lector.readAsDataURL(archivo);

    // Permite seleccionar nuevamente el mismo archivo
    input.value = '';
  }

  cancelarSeleccionFoto(): void {
    if (this.subiendoFoto) return;

    this.fotoSeleccionada = null;
    this.vistaPreviaFoto = null;
  }

  // GUARDAR FOTO

  guardarFoto(): void {
    if (
      !this.empleado ||
      !this.fotoSeleccionada ||
      this.subiendoFoto
    ) {
      return;
    }

    this.subiendoFoto = true;

    this.servicio.subirFoto(
      this.empleado.personalID,
      this.fotoSeleccionada
    ).subscribe({

      next: () => {
        this.subiendoFoto = false;

        this.fotoSeleccionada = null;
        this.vistaPreviaFoto = null;

        this.versionFoto++;
        this.fotoDisponible = true;

        this.mostrarToast(
          'Fotografía guardada correctamente.'
        );
      },

      error: (error: HttpErrorResponse) => {
        this.subiendoFoto = false;

        console.error('Error al subir foto:', error);

        this.mostrarToast(
          error.error?.mensaje ||
          'No se pudo subir la fotografía.',
          'error'
        );
      }
    });
  }

  // CONFIRMACIÓN DE ELIMINACIÓN

  solicitarEliminarFoto(): void {
    if (
      this.fotoDisponible &&
      !this.subiendoFoto
    ) {
      this.confirmarEliminarFoto = true;
    }
  }

  cancelarEliminarFoto(): void {
    if (!this.eliminandoFoto) {
      this.confirmarEliminarFoto = false;
    }
  }

  // ELIMINAR FOTO

  eliminarFoto(): void {
    if (!this.empleado || this.eliminandoFoto) {
      return;
    }

    this.eliminandoFoto = true;

    this.servicio.eliminarFoto(
      this.empleado.personalID
    ).subscribe({

      next: () => {
        this.fotoDisponible = false;
        this.eliminandoFoto = false;
        this.confirmarEliminarFoto = false;

        this.cancelarSeleccionFoto();

        this.mostrarToast(
          'Fotografía eliminada correctamente.'
        );
      },

      error: (error: HttpErrorResponse) => {
        this.eliminandoFoto = false;
        this.confirmarEliminarFoto = false;

        console.error('Error al eliminar foto:', error);

        this.mostrarToast(
          error.error?.mensaje ||
          `Error HTTP ${error.status} al eliminar foto.`,
          'error'
        );
      }
    });
  }

  // NOTIFICACIONES TEMPORALES

  mostrarToast(
    mensaje: string,
    tipo: 'exito' | 'error' = 'exito'
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

  volver(): void {
    this.router.navigate(['/empleados']);
  }

  ngOnDestroy(): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
    }
  }
}
