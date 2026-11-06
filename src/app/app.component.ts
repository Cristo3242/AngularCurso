import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CounterComponent } from './components/counter/counter.component';
import { ProductsComponent } from './components/products/products.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CounterComponent, ProductsComponent],
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
