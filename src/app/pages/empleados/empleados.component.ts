import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { empleado } from '../../interfaces/empleado.interface';
import { Puesto } from '../../interfaces/puesto.interface';
import { EmpleadosService } from '../../services/empleados.service';

type TipoToast = 'exito' | 'error' | 'advertencia';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit, OnDestroy {
  private readonly empleadosService = inject(EmpleadosService);
  private readonly router = inject(Router);

  empleadoEditado: number | null = null;
  mostrarFormulario = false;
  guardando = false;
  empleadoPorEliminar: empleado | null = null;

  puestos: Puesto[] = [];
  empleados: empleado[] = [];

  filtroBusqueda = '';
  filtroPuesto = 0;
  paginaActual = 1;
  registrosPorPagina = 10;
  totalRegistros = 0;
  totalPaginas = 0;
  cargando = false;
  private numeroSolicitud = 0;
  private temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;

  nombre = '';
  apellidos = '';
  fnacimiento = '';
  telefono = '';
  puestoID = 0;
  nomina = '';
  domicilio = '';
  numeroContacto = '';
  fechaMaxima = '';

  errorTelefono = false;
  errorNumeroContacto = false;
  errorFecha = false;
  mensajeErrorFecha = '';

  fotoSeleccionada: File | null = null;
  vistaPreviaFoto: string | null = null;
  fotoActualDisponible = false;

  mensajeToast = '';
  tipoToast: TipoToast = 'exito';
  private temporizadorToast: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.fechaMaxima = this.obtenerFechaActual();
    this.cargarPuestos();
    this.cargarEmpleados();
  }

  ngOnDestroy(): void {
    if (this.temporizadorToast) clearTimeout(this.temporizadorToast);
    if (this.temporizadorBusqueda) clearTimeout(this.temporizadorBusqueda);
  }

  mostrarToast(mensaje: string, tipo: TipoToast = 'exito'): void {
    if (this.temporizadorToast) clearTimeout(this.temporizadorToast);
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.temporizadorToast = setTimeout(() => {
      this.mensajeToast = '';
      this.temporizadorToast = null;
    }, 3500);
  }

  cerrarToast(): void {
    if (this.temporizadorToast) clearTimeout(this.temporizadorToast);
    this.temporizadorToast = null;
    this.mensajeToast = '';
  }

  verEmpleado(id: number): void {
    this.router.navigate(['/empleados', id]);
  }

  nuevoEmpleado(): void {
    this.limpiarFormulario();
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    if (this.guardando) return;
    this.limpiarFormulario();
    this.mostrarFormulario = false;
  }

  obtenerFechaActual(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  validarFecha(): void {
    this.errorFecha = false;
    this.mensajeErrorFecha = '';
    if (!this.fnacimiento) {
      this.errorFecha = true;
      this.mensajeErrorFecha = 'Selecciona una fecha de nacimiento.';
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.fnacimiento)) {
      this.errorFecha = true;
      this.mensajeErrorFecha = 'El año debe tener cuatro dígitos.';
      return;
    }
    const [anio, mes, dia] = this.fnacimiento.split('-').map(Number);
    if (anio < 1900 || this.fnacimiento > this.obtenerFechaActual()) {
      this.errorFecha = true;
      this.mensajeErrorFecha = 'La fecha está fuera del rango permitido.';
      return;
    }
    const fecha = new Date(0);
    fecha.setFullYear(anio, mes - 1, dia);
    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
      this.errorFecha = true;
      this.mensajeErrorFecha = 'Ingresa una fecha de nacimiento válida.';
    }
  }

  validarTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorTelefono = /\D/.test(input.value);
    this.telefono = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = this.telefono;
  }

  validarNumeroContacto(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorNumeroContacto = /\D/.test(input.value);
    this.numeroContacto = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = this.numeroContacto;
  }

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const permitidos = ['image/jpeg', 'image/png'];
    if (!permitidos.includes(archivo.type)) {
      this.mostrarToast('Solo se permiten fotografías JPG o PNG.', 'error');
      input.value = '';
      this.fotoSeleccionada = null;
      this.vistaPreviaFoto = null;
      return;
    }
    if (archivo.size > 3 * 1024 * 1024) {
      this.mostrarToast('La fotografía no puede superar 3 MB.', 'error');
      input.value = '';
      this.fotoSeleccionada = null;
      this.vistaPreviaFoto = null;
      return;
    }

    this.fotoSeleccionada = archivo;
    this.vistaPreviaFoto = null;
    const lector = new FileReader();
    lector.onload = () => {
      if (this.fotoSeleccionada === archivo) {
        this.vistaPreviaFoto = typeof lector.result === 'string' ? lector.result : null;
      }
    };
    lector.onerror = () => this.mostrarToast('No se pudo leer la fotografía.', 'error');
    lector.readAsDataURL(archivo);
  }

  obtenerUrlFoto(id: number): string {
    return this.empleadosService.obtenerUrlFoto(id);
  }

  cargarEmpleados(): void {
    const solicitudActual = ++this.numeroSolicitud;
    this.cargando = true;
    this.empleadosService.obtenerEmpleadosPaginados(
      this.paginaActual,
      this.registrosPorPagina,
      this.filtroBusqueda,
      this.filtroPuesto
    ).subscribe({
      next: (respuesta) => {
        if (solicitudActual !== this.numeroSolicitud) return;
        this.empleados = respuesta.empleados;
        this.totalRegistros = respuesta.total;
        this.totalPaginas = respuesta.totalPaginas;
        this.cargando = false;
        if (this.paginaActual > 1 && this.paginaActual > this.totalPaginas) {
          this.paginaActual = Math.max(1, this.totalPaginas);
          this.cargarEmpleados();
        }
      },
      error: (error: HttpErrorResponse) => {
        if (solicitudActual !== this.numeroSolicitud) return;
        this.cargando = false;
        this.empleados = [];
        console.error('Error al consultar empleados:', error);
        this.mostrarToast('No se pudo cargar la lista de empleados.', 'error');
      }
    });
  }

  cargarPuestos(): void {
    this.empleadosService.obtenerPuestos().subscribe({
      next: (datos) => this.puestos = datos,
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar puestos:', error);
        this.mostrarToast('No se pudo cargar el catálogo de puestos.', 'error');
      }
    });
  }

  aplicarFiltros(): void {
    if (this.temporizadorBusqueda) clearTimeout(this.temporizadorBusqueda);
    this.paginaActual = 1;
    this.cargarEmpleados();
  }

  aplicarBusqueda(): void {
    if (this.temporizadorBusqueda) clearTimeout(this.temporizadorBusqueda);
    this.temporizadorBusqueda = setTimeout(() => {
      this.paginaActual = 1;
      this.cargarEmpleados();
    }, 300);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (this.cargando || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.paginaActual = nuevaPagina;
    this.cargarEmpleados();
  }

  cambiarLimite(): void {
    this.paginaActual = 1;
    this.cargarEmpleados();
  }

  guardarEmpleado(): void {
    if (this.guardando) return;

    const puesto = this.puestos.find(p => p.PuestoID === this.puestoID);
    if (!this.nombre.trim() || !this.apellidos.trim() || !this.telefono.trim() ||
        !this.nomina.trim() || !this.domicilio.trim() ||
        !this.numeroContacto.trim() || !puesto) {
      this.mostrarToast('Completa todos los campos obligatorios.', 'advertencia');
      return;
    }

    this.validarFecha();
    if (this.errorFecha) {
      this.mostrarToast(this.mensajeErrorFecha, 'advertencia');
      return;
    }

    if (!/^\d{10}$/.test(this.telefono) || !/^\d{10}$/.test(this.numeroContacto)) {
      this.mostrarToast('Los números telefónicos deben tener 10 dígitos.', 'advertencia');
      return;
    }

    const datos: empleado = {
      personalID: this.empleadoEditado ?? 0,
      Nombre: this.nombre.trim(),
      Apellidos: this.apellidos.trim(),
      Fnacimiento: this.fnacimiento,
      Telefono: this.telefono,
      PuestoID: this.puestoID,
      NombrePuesto: puesto.NombrePuesto,
      Nomina: this.nomina.trim(),
      Domicilio: this.domicilio.trim(),
      NumeroContacto: this.numeroContacto
    };

    const idEditando = this.empleadoEditado;
    const foto = this.fotoSeleccionada;
    const peticion = idEditando === null
      ? this.empleadosService.guardarEmpleado(datos)
      : this.empleadosService.actualizarEmpleado(idEditando, datos);

    this.guardando = true;
    peticion.subscribe({
      next: (respuesta) => {
        const idEmpleado = idEditando ?? respuesta.personalID;
        if (!idEmpleado || !Number.isInteger(idEmpleado)) {
          this.guardando = false;
          this.cargarEmpleados();
          this.mostrarToast('Se guardaron los datos, pero no se recibió el ID para la foto.', 'advertencia');
          return;
        }

        if (!foto) {
          this.finalizarGuardado('Empleado guardado correctamente.');
          return;
        }

        this.empleadosService.subirFoto(idEmpleado, foto).subscribe({
          next: () => this.finalizarGuardado('Empleado y fotografía guardados correctamente.'),
          error: (error: HttpErrorResponse) => {
            console.error('Error al subir fotografía:', error);
            this.finalizarGuardado('El empleado se guardó, pero no se pudo cargar su fotografía.', 'advertencia');
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        console.error('Error al guardar empleado:', error);
        const mensaje = error.status === 409
          ? 'Este número de nómina ya está registrado.'
          : error.error?.mensaje || 'No se pudo guardar el empleado.';
        this.mostrarToast(mensaje, 'error');
      }
    });
  }

  private finalizarGuardado(mensaje: string, tipo: TipoToast = 'exito'): void {
    this.guardando = false;
    this.cargarEmpleados();
    this.cancelarFormulario();
    this.mostrarToast(mensaje, tipo);
  }

  editarEmpleado(e: empleado): void {
    this.empleadoEditado = e.personalID;
    this.nombre = e.Nombre;
    this.apellidos = e.Apellidos;
    this.fnacimiento = e.Fnacimiento;
    this.telefono = e.Telefono;
    this.puestoID = e.PuestoID;
    this.nomina = e.Nomina;
    this.domicilio = e.Domicilio;
    this.numeroContacto = e.NumeroContacto;
    this.fotoSeleccionada = null;
    this.vistaPreviaFoto = null;
    this.fotoActualDisponible = true;
    this.errorTelefono = false;
    this.errorNumeroContacto = false;
    this.errorFecha = false;
    this.mensajeErrorFecha = '';
    this.mostrarFormulario = true;
  }

  solicitarEliminar(e: empleado): void {
    this.empleadoPorEliminar = e;
  }

  cancelarEliminacion(): void {
    this.empleadoPorEliminar = null;
  }

  confirmarEliminacion(): void {
    const seleccionado = this.empleadoPorEliminar;
    if (!seleccionado) return;
    this.empleadoPorEliminar = null;

    this.empleadosService.eliminarEmpleado(seleccionado.personalID).subscribe({
      next: () => {
        if (this.empleadoEditado === seleccionado.personalID) this.cancelarFormulario();
        this.cargarEmpleados();
        this.mostrarToast('Empleado eliminado correctamente.', 'exito');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al eliminar empleado:', error);
        this.mostrarToast(error.error?.mensaje || 'No se pudo eliminar al empleado.', 'error');
      }
    });
  }

  limpiarFormulario(): void {
    this.nombre = '';
    this.apellidos = '';
    this.fnacimiento = '';
    this.telefono = '';
    this.puestoID = 0;
    this.nomina = '';
    this.domicilio = '';
    this.numeroContacto = '';
    this.empleadoEditado = null;
    this.fotoSeleccionada = null;
    this.vistaPreviaFoto = null;
    this.fotoActualDisponible = false;
    this.errorTelefono = false;
    this.errorNumeroContacto = false;
    this.errorFecha = false;
    this.mensajeErrorFecha = '';
  }
}
