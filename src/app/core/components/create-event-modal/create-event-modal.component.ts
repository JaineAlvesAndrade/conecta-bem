import { Component, EventEmitter, Output, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventsService, EventInput } from '../../services/events.service';
import { AddressService } from '../../services/address.service';
import { Event, EventCategory, EventCategoryLabels } from '../../models/event.model';
import { Address } from '../../models/address.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-event-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './create-event-modal.component.html',
  styleUrls: ['./create-event-modal.component.scss']
})
export class CreateEventModalComponent implements OnInit {
  @Input() eventToEdit: Event | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() eventCreated = new EventEmitter<Event>();
  @Output() eventUpdated = new EventEmitter<Event>();

  eventForm: FormGroup;
  addressForm: FormGroup;
  
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  addresses = signal<Address[]>([]);
  isLoadingAddresses = signal(false);
  showCreateAddressForm = signal(false);
  isCreatingAddress = signal(false);
  addressError = signal<string | null>(null);
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string>('/assets/no_image.png');
  isDeletingImage = signal(false);
  showDeleteImageConfirm = signal(false);

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
    this.prefillFormIfEditing();
  }

  get isEditMode(): boolean {
    return !!this.eventToEdit;
  }

  private prefillFormIfEditing() {
    if (!this.eventToEdit) {
      return;
    }

    this.eventForm.patchValue({
      title: this.eventToEdit.title,
      description: this.eventToEdit.description,
      addressId: this.eventToEdit.address?.id || '',
      category: this.eventToEdit.category,
      startsAt: this.formatDateForInput(this.eventToEdit.startsAt),
      endsAt: this.formatDateForInput(this.eventToEdit.endsAt),
      capacity: this.eventToEdit.capacity
    });

    this.imagePreview.set(this.eventToEdit.imageUrl || this.eventToEdit.image || '/assets/no_image.png');
  }

  private formatDateForInput(dateValue: string): string {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
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

  onImageSelected(event: any) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedImage.set(file);

    if (!file) {
      this.imagePreview.set(this.eventToEdit?.imageUrl || this.eventToEdit?.image || '/assets/no_image.png');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(typeof reader.result === 'string' ? reader.result : '/assets/no_image.png');
    };
    reader.readAsDataURL(file);
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

  requestDeleteImage() {
    if (!this.isEditMode || !this.eventToEdit || this.isDeletingImage()) {
      return;
    }

    this.showDeleteImageConfirm.set(true);
  }

  cancelDeleteImage() {
    if (this.isDeletingImage()) {
      return;
    }

    this.showDeleteImageConfirm.set(false);
  }

  confirmDeleteImage() {
    if (!this.isEditMode || !this.eventToEdit || this.isDeletingImage()) {
      return;
    }

    this.isDeletingImage.set(true);
    this.showDeleteImageConfirm.set(false);

    this.eventsService.deleteEventImage(this.eventToEdit.id).subscribe({
      next: (response) => {
        const currentEvent = this.eventToEdit;
        if (!currentEvent) {
          this.isDeletingImage.set(false);
          return;
        }

        const updatedImageUrl = response && typeof response === 'object' && 'imageUrl' in response
          ? (response as Event).imageUrl
          : undefined;

        const updatedImage = response && typeof response === 'object' && 'image' in response
          ? (response as Event).image
          : undefined;

        const updatedEvent: Event = {
          ...currentEvent,
          imageUrl: updatedImageUrl,
          image: updatedImage
        };

        this.imagePreview.set(updatedImageUrl || updatedImage || '/assets/no_image.png');
        this.selectedImage.set(null);
        this.eventToEdit = updatedEvent;
        this.eventUpdated.emit(updatedEvent);
        this.isDeletingImage.set(false);
      },
      error: (err) => {
        console.error('Erro ao remover imagem:', err);
        this.error.set('Falha ao remover imagem. Tente novamente.');
        this.isDeletingImage.set(false);
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
    const eventData: EventInput = {
      title: formValue.title,
      description: formValue.description,
      addressId: formValue.addressId,
      category: formValue.category,
      startsAt: new Date(formValue.startsAt).toISOString().slice(0, -1),
      endsAt: new Date(formValue.endsAt).toISOString().slice(0, -1),
      capacity: parseInt(formValue.capacity, 10),
      image: this.selectedImage()
    };

    const request$ = this.isEditMode && this.eventToEdit
      ? this.eventsService.updateEvent(this.eventToEdit.id, eventData)
      : this.eventsService.createEvent(eventData);

    request$.subscribe({
      next: (savedEvent) => {
        this.isSubmitting.set(false);
        if (this.isEditMode) {
          this.eventUpdated.emit(savedEvent);
        } else {
          this.eventCreated.emit(savedEvent);
        }
        this.closeModal();
      },
      error: (err) => {
        console.error('Erro ao salvar evento:', err);
        this.error.set(this.isEditMode ? 'Falha ao atualizar evento. Tente novamente.' : 'Falha ao criar evento. Tente novamente.');
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
    this.showDeleteImageConfirm.set(false);
    this.isDeletingImage.set(false);
    this.selectedImage.set(null);
    this.imagePreview.set(this.eventToEdit?.imageUrl || this.eventToEdit?.image || '/assets/no_image.png');
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
