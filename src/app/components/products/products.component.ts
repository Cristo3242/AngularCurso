import { Component } from '@angular/core';
import { Product } from '../../interfaces/product.interface'

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {

  //products es un objeto
  //Product es una interface que contiene objetos 

  products: Product []= [
];
}
