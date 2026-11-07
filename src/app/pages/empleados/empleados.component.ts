import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { empleado } from '../../interfaces/empleado.interface';
import { Puesto } from '../../interfaces/puesto.interface';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent {

  puestos: Puesto[] = [
    { PuestoID: 1, NombrePuesto: 'Desarrollador' },
    { PuestoID: 2, NombrePuesto: 'Recursos Humanos' },
    { PuestoID: 3, NombrePuesto: 'Soporte TI' }
  ];

  empleados: empleado[] = [
    {
    personalID: 1,
    Nombre: 'Carlos',
    Apellidos: 'Ramirez',
    Fnacimiento: '1998-05-05',
    Telefono: '4771234567',
    PuestoID: 1,
    NombrePuesto: 'Desarrollador'
  },
  {
    personalID: 2,
    Nombre: 'Maria',
    Apellidos: 'Lopez',
    Fnacimiento: '2001-08-22',
    Telefono: '4771234567',
    PuestoID: 1,
    NombrePuesto: 'Desarrollador'
  }
];

  nombre: string = '';
  apellidos: string = '';
  fnacimiento: string = '';
  telefono: string = '';
  puestoID: number = 0;
}
