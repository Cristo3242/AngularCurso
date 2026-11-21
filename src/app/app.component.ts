
import { Component, OnDestroy, OnInit } from '@angular/core';

import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd
} from '@angular/router';

import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {

  menuAbierto = true;

  private navegacion?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {

    // Cerrar automáticamente el menú después
    // de cambiar de página en celular.
    this.navegacion = this.router.events
      .pipe(
        filter(
          (evento): evento is NavigationEnd =>
            evento instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        if (window.innerWidth <= 768) {
          this.menuAbierto = false;
        }
      });

    // En celular, iniciar con el menú cerrado.
    if (window.innerWidth <= 768) {
      this.menuAbierto = false;
    }
  }

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  ngOnDestroy(): void {
    this.navegacion?.unsubscribe();
  }
}
