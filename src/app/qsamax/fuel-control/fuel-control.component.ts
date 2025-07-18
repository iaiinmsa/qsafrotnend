// fuel-control.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FuelConsumptionComponent } from './fuel-consumption.component';
import { environment } from '../../../environments/environment';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, takeUntil } from 'rxjs';
import { WorkOrder } from '../../models/Product.model';

@Component({
standalone: true,
  selector: 'app-fuel-control',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule, // 👈 también aquí
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDialogModule,
MatButtonModule,
  ],
  templateUrl: './fuel-control.component.html',
  styleUrls: ['./fuel-control.component.scss']
})
export class FuelControlComponent implements OnInit {
  fuelForm!: FormGroup;
  cars: any[] = [];
  operators: any[] = [];
  selectedCarType: any = null;
  showSuccessMessage = false;
workOrderSearchTerm = new Subject<string>();
filteredWorkOrdersd$!: Observable<WorkOrder[]>;
private allops: WorkOrder[] = [];
  ops$: Observable<WorkOrder[]> = of([]);
 //  searchWorkOrderTerm = new Subject<string>();
private destroy$ = new Subject<void>();


  


  constructor(private fb: FormBuilder, private http: HttpClient,
public dialogRef: MatDialogRef<FuelConsumptionComponent>

  ) {}

  ngOnInit(): void {
    this.fuelForm = this.fb.group({
      orderDate: [null, Validators.required],
      productionorderid: ['', Validators.required],
      activity: ['', Validators.required],
      carId: [null, Validators.required],
      transportoperatorid: [null, Validators.required],
      initialreading: [null, Validators.required],
      finalreeading: [null, Validators.required],
      partial: [null, Validators.required] ,
      consume: [null, Validators.required],
       

    
    });

    this.fuelForm.get('initialreading')!.valueChanges.subscribe(() => this.calculatePartial());
    this.fuelForm.get('finalreeading')!.valueChanges.subscribe(() => this.calculatePartial());
      

    this.loadCars();
    this.loadOperators();
     this.workOrderSearchTerm.next('');
     this.loadworkorder();
   //  this.setupWorkorderFilter();
  }


   readingValidator(group: FormGroup): {[key: string]: any} | null {
    const initial = group.get('initialreading')?.value;
    const final = group.get('finalreeading')?.value;
    
    if (initial !== null && final !== null && final < initial) {
      return { 'finalReadingInvalid': true };
    }
    return null;
  }


    calculatePartial() {
    const initial = this.fuelForm.get('initialreading')?.value;
    const final = this.fuelForm.get('finalreeading')?.value;
    const partial = final !== null && initial !== null ? final - initial : null;
    this.fuelForm.patchValue({ partial: partial }, { emitEvent: false }); // No emitir otro evento de cambio
  }


    loadworkorder(): void {
  
      this.http.get<WorkOrder[]>(`${environment.apiUrlqsa}/workordershow`).pipe(
    catchError(() => of([]))
  ).subscribe(products => {
    this.allops = products;

    this.filteredWorkOrdersd$ = this.workOrderSearchTerm.pipe(
      startWith(''), // muestra todo al inicio
      debounceTime(300),
      distinctUntilChanged(),
      map(term => term.trim().toLowerCase()),
      map(searchTerm => {
        return this.allops.filter(product =>
          (product.op?.toLowerCase() || '').includes(searchTerm) ||
          (product.descripcion?.toLowerCase() || '').includes(searchTerm)
        );
      })
    );
  });

 }



  loadCars() {
    this.http.get<any[]>(`${environment.apiUrlqsa}/car`).subscribe(data => {
      this.cars = data;
    });
  }

  loadOperators() {
    this.http.get<any[]>(`${environment.apiUrlqsa}/transport-operator`).subscribe(data => {
      this.operators = data;
    });
  }

  onCarChange(carId: number) {
    const selected = this.cars.find(c => c.id === carId);
    this.selectedCarType = selected?.typeCar || null;
    console.log('Tipo de vehículo:', this.selectedCarType);
  }

    onCancel(): void {
    this.dialogRef.close();
  }


 onSubmit() {
    console.log('Formulario enviado:', this.fuelForm.value);
   

    if (this.fuelForm.valid) {
      this.http.post(`${environment.apiUrlqsa}/fuel-consumption-control`, this.fuelForm.value)
        .subscribe({
          next: (res) => {
                 this.showSuccessMessage = true; // 👉 mostrar mensaje
          setTimeout(() => {
            this.showSuccessMessage = false; // 👉 ocultar después de 3 segundos
          }, 5000);

            //alert('✅ Registro guardado con éxito');
            this.dialogRef.close(res); // ✅ opcional: enviar los datos insertados al padre
          },
          error: (err) => {
            console.error(err);
            alert('❌ Error al guardar');
          }
        });
    }
  }


    onWorkOrderSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.workOrderSearchTerm.next(input.value); // 🔥 Esto emite al observable
  }




}
