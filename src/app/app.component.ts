import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CounterComponent } from './components/counter/counter.component';
import { ProductsComponent } from './components/products/products.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CounterComponent, ProductsComponent, EmpleadosComponent],
  templateUrl: './app.component.html',
})

export class AppComponent {
  name: string = 'Cristopher';

  showCounter(value: number) {
    console.log('El contador cambio', value)
  }

  showReset(value: number) {
    console.log('El contador se reinicio', value)
  }

}
