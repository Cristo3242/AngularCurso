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
    {id: 1,
    name: 'Teclado mecanico',
    price: 850,
    stock: 12,
    category: 'Teclado'
  },
  {
    id: 2,
    name: 'Mouse gamer',
    price: 450,
    stock: 8,
    category: 'Mouse'
  },
  {
    id: 3,
    name: 'Monitor',
    price: 3200,
    stock: 4,
    category: 'Monitor'
  },
  {
    id: 4,
    name: 'Audifonos',
    price: 1200,
    stock: 15,
    category: 'Audifonos'
  }
];
}
