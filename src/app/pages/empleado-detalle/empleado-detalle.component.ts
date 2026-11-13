
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
export class EmpleadoDetalleComponent implements OnInit, OnDestroy {

  empleado: empleado | null = null;

  cargando: boolean = true;
  mensajeError: string = '';

  // Fotografía
  fotoDisponible: boolean = true;
  confirmarEliminarFoto: boolean = false;
  eliminandoFoto: boolean = false;

  // Notificación temporal
  mensajeToast: string = '';
  tipoToast: 'exito' | 'error' = 'exito';

  private temporizadorToast:
    ReturnType<typeof setTimeout> | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private empleadosService = inject(EmpleadosService);

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.cargando = false;
      this.mensajeError = 'El ID del empleado no es válido.';
      return;
    }

    this.empleadosService.obtenerEmpleadoPorId(id).subscribe({

      next: (datos: empleado) => {
        this.empleado = datos;
        this.fotoDisponible = true;
        this.cargando = false;
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar empleado:', error);

        this.mensajeError =
          'No se pudo consultar el expediente.';

        this.cargando = false;
      }

    });
  }

  // Obtener la fotografía desde Express
  obtenerUrlFoto(): string {
    if (!this.empleado) {
      return '';
    }

    return this.empleadosService.obtenerUrlFoto(
      this.empleado.personalID
    );
  }

  // Abro confirmación
  solicitarEliminarFoto(): void {
    if (!this.empleado || !this.fotoDisponible) {
      return;
    }

    this.confirmarEliminarFoto = true;
  }

  // Cancelo eliminación
  cancelarEliminarFoto(): void {
    if (this.eliminandoFoto) {
      return;
    }

    this.confirmarEliminarFoto = false;
  }

  // Elimino únicamente la fotografía
  eliminarFoto(): void {
    if (!this.empleado || this.eliminandoFoto) {
      return;
    }

    this.eliminandoFoto = true;

    this.empleadosService
      .eliminarFoto(this.empleado.personalID)
      .subscribe({

        next: () => {
          this.fotoDisponible = false;
          this.confirmarEliminarFoto = false;
          this.eliminandoFoto = false;

          this.mostrarToast(
            'Fotografía eliminada correctamente.',
            'exito'
          );
        },

        error: (error: HttpErrorResponse) => {
  console.error('Error al eliminar foto:', error);

  this.eliminandoFoto = false;
  this.confirmarEliminarFoto = false;

  this.mostrarToast(
    error.error?.mensaje || 'No se pudo eliminar la fotografía.',
    'error'
  );
}
      });
  }

  // Mensaje 
  mostrarToast(
    mensaje: string,
    tipo: 'exito' | 'error'
  ): void {

    if (this.temporizadorToast !== null) {
      clearTimeout(this.temporizadorToast);
    }

    this.mensajeToast = mensaje;
    this.tipoToast = tipo;

    this.temporizadorToast = setTimeout(() => {
      this.mensajeToast = '';
      this.temporizadorToast = null;
    }, 3500);
  }

  volver(): void {
    this.router.navigate(['/empleados']);
  }

  ngOnDestroy(): void {
    if (this.temporizadorToast !== null) {
      clearTimeout(this.temporizadorToast);
    }
  }
}
