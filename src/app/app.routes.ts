
import { Routes } from '@angular/router';

import { InicioComponent } from './pages/inicio/inicio.component';

import { EmpleadosComponent } from './pages/empleados/empleados.component';

import { EmpleadoDetalleComponent } from './pages/empleado-detalle/empleado-detalle.component';

import { PuestosComponent } from './pages/puestos/puestos.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: InicioComponent
  },
  {
    path: 'empleados',
    component: EmpleadosComponent
  },
  {
    path: 'empleados/:id',
    component: EmpleadoDetalleComponent
  },
  {
    path: 'puestos',
    component: PuestosComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
