import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.css'
})

export class CounterComponent {
      @Input() title: string = 'Mi contador';
      @Input() counter: number = 10;

      @Output() counterChanged = new EventEmitter<number>();
      @Output() resetCounterChanged = new EventEmitter<number>();

      increaseBy(value: number) {
        this.counter += value;
        this.counterChanged.emit(this.counter);
      }

      resetCounter() {
        this.counter = 0;
        this.resetCounterChanged.emit(this.counter)
      }
}
