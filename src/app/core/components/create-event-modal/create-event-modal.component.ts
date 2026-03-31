import { Component, EventEmitter, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventsService } from '../../services/events.service';
import { AddressService } from '../../services/address.service';
import { Event, EventCategory, EventCategoryLabels } from '../../models/event.model';
import { Address } from '../../models/address.model';

@Component({
  selector: 'app-create-event-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event-modal.component.html',
  styleUrls: ['./create-event-modal.component.scss']
})
export class CreateEventModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() eventCreated = new EventEmitter<Event>();

  eventForm: FormGroup;
  addressForm: FormGroup;
  
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  addresses = signal<Address[]>([]);
  isLoadingAddresses = signal(false);
  showCreateAddressForm = signal(false);
  isCreatingAddress = signal(false);
  addressError = signal<string | null>(null);

  categories = Object.values(EventCategory).map(cat => ({
    value: cat,
    label: EventCategoryLabels[cat]
  }));

  constructor(
    private fb: FormBuilder,
    private eventsService: EventsService,
    private addressService: AddressService
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      addressId: ['', Validators.required],
      category: [EventCategory.SOCIAL, Validators.required],
      startsAt: ['', Validators.required],
      endsAt: ['', Validators.required],
      capacity: ['', [Validators.required, Validators.min(1)]]
    });

    this.addressForm = this.fb.group({
      country: ['Brasil', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      street: ['', Validators.required],
      complement: [''],
      number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      reference: [''],
      postalCode: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadAddresses();
  }

  private loadAddresses() {
    this.isLoadingAddresses.set(true);
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.isLoadingAddresses.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar endereços:', err);
        this.error.set('Falha ao carregar endereços');
        this.isLoadingAddresses.set(false);
      }
    });
  }

  toggleCreateAddressForm() {
    this.showCreateAddressForm.update(v => !v);
    if (!this.showCreateAddressForm()) {
      this.addressForm.reset({ country: 'Brasil' });
      this.addressError.set(null);
    }
  }

  onCreateAddress() {
    if (this.addressForm.invalid) {
      this.addressError.set('Preencha todos os campos obrigatórios');
      return;
    }

    this.isCreatingAddress.set(true);
    this.addressError.set(null);

    this.addressService.createAddress(this.addressForm.value).subscribe({
      next: (newAddress) => {
        // Adiciona o novo endereço à lista
        this.addresses.update(addrs => [...addrs, newAddress]);
        
        // Seleciona o novo endereço automaticamente
        this.eventForm.patchValue({ addressId: newAddress.id });
        
        // Fecha o formulário de criar endereço
        this.showCreateAddressForm.set(false);
        this.addressForm.reset({ country: 'Brasil' });
        
        this.isCreatingAddress.set(false);
      },
      error: (err) => {
        console.error('Erro ao criar endereço:', err);
        this.addressError.set('Falha ao criar endereço. Tente novamente.');
        this.isCreatingAddress.set(false);
      }
    });
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      this.error.set('Preencha todos os campos corretamente');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.eventForm.value;
    const eventData = {
      title: formValue.title,
      description: formValue.description,
      addressId: formValue.addressId,
      category: formValue.category,
      startsAt: new Date(formValue.startsAt).toISOString().slice(0, -1),
      endsAt: new Date(formValue.endsAt).toISOString().slice(0, -1),
      capacity: parseInt(formValue.capacity, 10)
    };

    this.eventsService.createEvent(eventData).subscribe({
      next: (newEvent) => {
        this.isSubmitting.set(false);
        this.eventCreated.emit(newEvent);
        this.closeModal();
      },
      error: (err) => {
        console.error('Erro ao criar evento:', err);
        this.error.set('Falha ao criar evento. Tente novamente.');
        this.isSubmitting.set(false);
      }
    });
  }

  closeModal() {
    this.eventForm.reset({ category: EventCategory.SOCIAL });
    this.addressForm.reset({ country: 'Brasil' });
    this.error.set(null);
    this.addressError.set(null);
    this.showCreateAddressForm.set(false);
    this.close.emit();
  }

  getFieldError(fieldName: string, form: FormGroup = this.eventForm): string | null {
    const field = form.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    if (field.errors['required']) return 'Este campo é obrigatório';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `Mínimo ${field.errors['min'].min}`;

    return null;
  }

  getAddressLabel(address: Address): string {
    return `${address.street}, ${address.number} - ${address.city}, ${address.state}`;
  }
}
