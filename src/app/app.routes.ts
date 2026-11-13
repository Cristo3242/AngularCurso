
import { Routes } from '@angular/router';

import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { EmpleadoDetalleComponent } from './pages/empleado-detalle/empleado-detalle.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'empleados',
    pathMatch: 'full'
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
    path: '**',
    redirectTo: 'empleados'
  }
];
