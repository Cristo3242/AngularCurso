import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { empleado } from '../../interfaces/empleado.interface';
import { Puesto } from '../../interfaces/puesto.interface';
import { EmpleadosService, RespuestaRegistro, Estadisticas, CampoFiltro, EstadoFiltro } from '../../services/empleados.service';

type TipoToast = 'exito' | 'error' | 'advertencia';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit, OnDestroy {

  private servicio = inject(EmpleadosService);
  private router = inject(Router);

  // Información
  empleados: empleado[] = [];
  puestos: Puesto[] = [];
  estadisticas: Estadisticas | null = null;

  // Formulario
  empleadoEditado: number | null = null;
  mostrarFormulario = false;
  guardando = false;

  // Bajas y reactivaciones
  empleadoPorCambiar: empleado | null = null;
  motivoBaja = '';
  cambiandoEstado = false;

  // Filtros
  mostrarFiltros = false;
  filtroActivos = true;
  filtroInactivos = true;
  filtroEstado: EstadoFiltro = 'todos';
  filtroBusqueda = '';
  filtroPuesto = 0;

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 10;
  totalRegistros = 0;
  totalPaginas = 0;
  cargando = false;

  private numeroSolicitud = 0;

  private temporizadorBusqueda:
    ReturnType<typeof setTimeout> | null = null;

  private temporizadorToast:
    ReturnType<typeof setTimeout> | null = null;

  // Notificaciones
  mensajeToast = '';
  tipoToast: TipoToast = 'exito';

  // Campos
  nombre = '';
  apellidos = '';
  fnacimiento = '';
  telefono = '';
  puestoID = 0;
  nomina = '';
  domicilio = '';
  numeroContacto = '';
  fechaMaxima = '';

  // Validaciones
  errorTelefono = false;
  errorNumeroContacto = false;
  errorFecha = false;
  mensajeErrorFecha = '';

  // Foto
  fotoSeleccionada: File | null = null;
  vistaPreviaFoto: string | null = null;
  fotoActualDisponible = false;


cambiarFiltroEstado(): void {

  // Evitar que se desmarquen las dos casillas
  if (!this.filtroActivos && !this.filtroInactivos) {

    this.filtroActivos = true;
    this.filtroInactivos = true;

    this.mostrarToast(
      'Debes mantener al menos un estado seleccionado.',
      'advertencia'
    );

    this.aplicarFiltros();
    return;
  }

  // Ambos seleccionados = todos
  if (this.filtroActivos && this.filtroInactivos) {
    this.filtroEstado = 'todos';
  }

  // Solo activos
  else if (this.filtroActivos) {
    this.filtroEstado = 'activo';
  }

  // Solo inactivos
  else {
    this.filtroEstado = 'inactivo';
  }

  this.aplicarFiltros();
}


  ngOnInit(): void {
    this.fechaMaxima = this.obtenerFechaActual();
    this.cargarPuestos();
    this.cargarEstadisticas();
    this.cargarEmpleados();
  }

  ngOnDestroy(): void {
    if (this.temporizadorToast !== null) {
      clearTimeout(this.temporizadorToast);
    }

    if (this.temporizadorBusqueda !== null) {
      clearTimeout(this.temporizadorBusqueda);
    }
  }

  mostrarToast(
    mensaje: string,
    tipo: TipoToast = 'exito'
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

  cerrarToast(): void {
    if (this.temporizadorToast !== null) {
      clearTimeout(this.temporizadorToast);
    }

    this.temporizadorToast = null;
    this.mensajeToast = '';
  }

  // FECHA ACTUAL

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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.fnacimiento)) {
      this.errorFecha = true;
      this.mensajeErrorFecha =
        'Selecciona una fecha con año de cuatro dígitos.';
      return;
    }

    const [anio, mes, dia] = this.fnacimiento
      .split('-')
      .map(Number);

    const fecha = new Date(0);
    fecha.setFullYear(anio, mes - 1, dia);

    if (
      anio < 1900 ||
      this.fnacimiento > this.fechaMaxima ||
      fecha.getFullYear() !== anio ||
      fecha.getMonth() !== mes - 1 ||
      fecha.getDate() !== dia
    ) {
      this.errorFecha = true;
      this.mensajeErrorFecha =
        'Fecha de nacimiento inválida.';
    }
  }

  validarTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.errorTelefono = /\D/.test(input.value);

    this.telefono = input.value
      .replace(/\D/g, '')
      .slice(0, 10);

    input.value = this.telefono;
  }

  validarNumeroContacto(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.errorNumeroContacto = /\D/.test(input.value);

    this.numeroContacto = input.value
      .replace(/\D/g, '')
      .slice(0, 10);

    input.value = this.numeroContacto;
  }

  // CARGAR ESTADÍSTICAS

  cargarEstadisticas(): void {
    this.servicio.obtenerEstadisticas().subscribe({
      next: (datos: Estadisticas) => {
        this.estadisticas = datos;
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error de estadísticas:', error);

        this.mostrarToast(
          'No se pudieron cargar los indicadores.',
          'error'
        );
      }
    });
  }

  // CARGAR PUESTOS

  cargarPuestos(): void {
    this.servicio.obtenerPuestos().subscribe({
      next: (datos: Puesto[]) => {
        this.puestos = datos;
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error de puestos:', error);

        this.mostrarToast(
          'No se pudieron cargar los puestos.',
          'error'
        );
      }
    });
  }

  // CARGAR EMPLEADOS CON FILTROS Y PAGINACIÓN

  cargarEmpleados(): void {
    const solicitudActual = ++this.numeroSolicitud;

    this.cargando = true;

    this.servicio.obtenerEmpleadosPaginados(
      this.paginaActual,
      this.registrosPorPagina,
      this.filtroBusqueda,
      this.filtroPuesto,
      'todos',
      this.filtroEstado
    ).subscribe({

      next: respuesta => {
        if (solicitudActual !== this.numeroSolicitud) {
          return;
        }

        this.empleados = respuesta.empleados;
        this.totalRegistros = respuesta.total;
        this.totalPaginas = respuesta.totalPaginas;
        this.cargando = false;

        if (
          this.paginaActual > 1 &&
          this.paginaActual > this.totalPaginas
        ) {
          this.paginaActual = Math.max(
            1,
            this.totalPaginas
          );

          this.cargarEmpleados();
        }
      },

      error: (error: HttpErrorResponse) => {
        if (solicitudActual !== this.numeroSolicitud) {
          return;
        }

        this.cargando = false;

        console.error('Error en tabla:', error);

        this.mostrarToast(
          'No se pudo cargar la tabla.',
          'error'
        );
      }
    });
  }

  // FILTROS

  aplicarFiltros(): void {
    if (this.temporizadorBusqueda !== null) {
      clearTimeout(this.temporizadorBusqueda);
    }

    this.paginaActual = 1;
    this.cargarEmpleados();
  }

  aplicarBusqueda(): void {
    if (this.temporizadorBusqueda !== null) {
      clearTimeout(this.temporizadorBusqueda);
    }

    this.temporizadorBusqueda = setTimeout(() => {
      this.paginaActual = 1;
      this.cargarEmpleados();
    }, 300);
  }

  limpiarFiltros(): void {

  this.filtroBusqueda = '';
  this.filtroPuesto = 0;

  this.filtroActivos = true;
  this.filtroInactivos = true;

  this.filtroEstado = 'todos';

  this.aplicarFiltros();
}

  cambiarPagina(nuevaPagina: number): void {
    if (
      this.cargando ||
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPaginas
    ) {
      return;
    }

    this.paginaActual = nuevaPagina;
    this.cargarEmpleados();
  }

  cambiarLimite(): void {
    this.aplicarFiltros();
  }

  // FORMULARIO

  nuevoEmpleado(): void {
    this.limpiarFormulario();
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    if (this.guardando) return;

    this.limpiarFormulario();
    this.mostrarFormulario = false;
  }

  verEmpleado(id: number): void {
    this.router.navigate(['/empleados', id]);
  }

  // FOTOGRAFÍA

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    if (
      !['image/jpeg', 'image/png'].includes(archivo.type) ||
      archivo.size > 3 * 1024 * 1024
    ) {
      this.mostrarToast(
        'La foto debe ser JPG o PNG y pesar máximo 3 MB.',
        'advertencia'
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
  }

  obtenerUrlFoto(id: number): string {
    return this.servicio.obtenerUrlFoto(id);
  }

  // REGISTRAR / ACTUALIZAR

  guardarEmpleado(): void {
    if (this.guardando) return;

    const puesto = this.puestos.find(
      p => p.PuestoID === this.puestoID
    );

    if (
      !this.nombre.trim() ||
      !this.apellidos.trim() ||
      !this.nomina.trim() ||
      !this.domicilio.trim() ||
      !puesto
    ) {
      this.mostrarToast(
        'Completa los campos obligatorios.',
        'advertencia'
      );
      return;
    }

    if (
      this.empleadoEditado === null &&
      !puesto.Activo
    ) {
      this.mostrarToast(
        'No puedes registrar en un puesto inactivo.',
        'advertencia'
      );
      return;
    }

    this.validarFecha();

    if (this.errorFecha) {
      this.mostrarToast(
        this.mensajeErrorFecha,
        'advertencia'
      );
      return;
    }

    if (!/^[0-9]{4}$/.test(this.nomina)) {
      this.mostrarToast(
        'La nómina debe contener exactamente 4 números.',
        'advertencia'
      );
      return;
    }

    if (
      !/^\d{10}$/.test(this.telefono) ||
      !/^\d{10}$/.test(this.numeroContacto)
    ) {
      this.mostrarToast(
        'Los teléfonos deben tener 10 dígitos.',
        'advertencia'
      );
      return;
    }

    const datos: empleado = {
      personalID: this.empleadoEditado ?? 0,
      PuestoID: this.puestoID,
      Nombre: this.nombre.trim(),
      Apellidos: this.apellidos.trim(),
      Fnacimiento: this.fnacimiento,
      Telefono: this.telefono,
      NombrePuesto: puesto.NombrePuesto,
      Nomina: this.nomina.trim(),
      Domicilio: this.domicilio.trim(),
      NumeroContacto: this.numeroContacto,
      Activo: true
    };

    const idEditando = this.empleadoEditado;
    const foto = this.fotoSeleccionada;

    // Normalizamos la respuesta de POST y PUT
    const peticion: Observable<RespuestaRegistro> =
      idEditando === null
        ? this.servicio.guardarEmpleado(datos)
        : this.servicio.actualizarEmpleado(
          idEditando,
          datos
        ).pipe(
          map(() => ({
            personalID: idEditando
          }))
        );

    this.guardando = true;

    peticion.subscribe({

      next: respuesta => {
        const personalID = respuesta.personalID;

        if (!foto) {
          this.finalizarGuardado(
            'Empleado guardado correctamente.'
          );
          return;
        }

        this.servicio.subirFoto(
          personalID,
          foto
        ).subscribe({

          next: () => {
            this.finalizarGuardado(
              'Empleado y fotografía guardados.'
            );
          },

          error: (error: HttpErrorResponse) => {
            console.error('Error de foto:', error);

            this.finalizarGuardado(
              'Datos guardados, pero falló la fotografía.',
              'advertencia'
            );
          }
        });
      },

      error: (error: HttpErrorResponse) => {
        this.guardando = false;

        this.mostrarToast(
          error.status === 409
            ? error.error?.mensaje ||
            'La nómina ya existe o el puesto no está disponible.'
            : error.error?.mensaje ||
            'No se pudo guardar el empleado.',
          'error'
        );
      }
    });
  }

  private finalizarGuardado(
    mensaje: string,
    tipo: TipoToast = 'exito'
  ): void {
    this.guardando = false;
    this.cancelarFormulario();
    this.cargarEmpleados();
    this.cargarEstadisticas();
    this.mostrarToast(mensaje, tipo);
  }

  // EDITAR

  editarEmpleado(e: empleado): void {
    this.limpiarFormulario();

    this.empleadoEditado = e.personalID;
    this.nombre = e.Nombre;
    this.apellidos = e.Apellidos;
    this.fnacimiento = e.Fnacimiento;
    this.telefono = e.Telefono;
    this.puestoID = e.PuestoID;
    this.nomina = e.Nomina;
    this.domicilio = e.Domicilio;
    this.numeroContacto = e.NumeroContacto;

    this.fotoActualDisponible = true;
    this.mostrarFormulario = true;
  }

  // DAR DE BAJA / REACTIVAR

  solicitarCambioEstado(e: empleado): void {
    this.empleadoPorCambiar = e;
    this.motivoBaja = '';
  }

  cancelarCambioEstado(): void {
    if (!this.cambiandoEstado) {
      this.empleadoPorCambiar = null;
    }
  }

  confirmarCambioEstado(): void {
    const seleccionado = this.empleadoPorCambiar;

    if (
      !seleccionado ||
      this.cambiandoEstado
    ) {
      return;
    }

    this.cambiandoEstado = true;

    this.servicio.cambiarEstadoEmpleado(
      seleccionado.personalID,
      !seleccionado.Activo,
      seleccionado.Activo ? this.motivoBaja : ''
    ).subscribe({

      next: respuesta => {
        this.cambiandoEstado = false;
        this.empleadoPorCambiar = null;

        this.cargarEmpleados();
        this.cargarEstadisticas();

        this.mostrarToast(respuesta.mensaje);
      },

      error: (error: HttpErrorResponse) => {
        this.cambiandoEstado = false;
        this.empleadoPorCambiar = null;

        this.mostrarToast(
          error.error?.mensaje ||
          'No se pudo cambiar el estado.',
          'error'
        );
      }
    });
  }

  // LIMPIAR FORMULARIO

  limpiarFormulario(): void {
    this.empleadoEditado = null;
    this.nombre = '';
    this.apellidos = '';
    this.fnacimiento = '';
    this.telefono = '';
    this.puestoID = 0;
    this.nomina = '';
    this.domicilio = '';
    this.numeroContacto = '';

    this.fotoSeleccionada = null;
    this.vistaPreviaFoto = null;
    this.fotoActualDisponible = false;

    this.errorFecha = false;
    this.errorTelefono = false;
    this.errorNumeroContacto = false;
    this.mensajeErrorFecha = '';
  }
}
