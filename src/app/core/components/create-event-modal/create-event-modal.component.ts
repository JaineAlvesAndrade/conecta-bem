import { Component, EventEmitter, Output, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventsService, EventInput } from '../../services/events.service';
import { AddressService } from '../../services/address.service';
import { Event, EventCategory, EventCategoryLabels } from '../../models/event.model';
import { Address } from '../../models/address.model';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsService } from '../../services/notifications.service';

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
    private addressService: AddressService,
    private notificationsService: NotificationsService
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      addressId: ['', Validators.required],
      category: [EventCategory.SOCIAL, Validators.required],
      type: ['COMMUNITY', Validators.required],
      organizationName: [''],
      organizationDocument: [''],
      startsAt: ['', Validators.required],
      endsAt: ['', Validators.required],
      capacity: ['', [Validators.required, Validators.min(1)]]
    }, {
      validators: [this.dateRangeValidator]
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
    this.configureEventTypeValidation();
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
      type: this.eventToEdit.type || 'COMMUNITY',
      organizationName: this.eventToEdit.organizationName || '',
      organizationDocument: this.eventToEdit.organizationDocument || '',
      startsAt: this.formatDateForInput(this.eventToEdit.startsAt),
      endsAt: this.formatDateForInput(this.eventToEdit.endsAt),
      capacity: this.eventToEdit.capacity
    });

    this.imagePreview.set(this.eventToEdit.imageUrl || this.eventToEdit.image || '/assets/no_image.png');
  }

  private configureEventTypeValidation() {
    this.eventForm.get('type')?.valueChanges.subscribe((type) => {
      this.applyEventTypeValidation(type);
    });

    this.applyEventTypeValidation(this.eventForm.get('type')?.value);
  }

  private applyEventTypeValidation(type: string) {
    const organizationName = this.eventForm.get('organizationName');
    const organizationDocument = this.eventForm.get('organizationDocument');

    if (type === 'ORGANIZATION') {
      organizationName?.setValidators([Validators.required, Validators.minLength(3)]);
      organizationDocument?.setValidators([
        Validators.required,
        Validators.pattern(/^(\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/)
      ]);
    } else {
      organizationName?.clearValidators();
      organizationDocument?.clearValidators();
      organizationName?.setValue('', { emitEvent: false });
      organizationDocument?.setValue('', { emitEvent: false });
    }

    organizationName?.updateValueAndValidity({ emitEvent: false });
    organizationDocument?.updateValueAndValidity({ emitEvent: false });
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
        this.addresses.update(addrs => [...addrs, newAddress]);
        
        this.eventForm.patchValue({ addressId: newAddress.id });
        
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
      this.eventForm.markAllAsTouched();
      this.error.set('Preencha todos os campos corretamente');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.eventForm.value;
    const startsAt = this.formatDateForBackend(formValue.startsAt);
    const endsAt = this.formatDateForBackend(formValue.endsAt);
    const capacity = Number(formValue.capacity);

    if (!startsAt || !endsAt || !Number.isInteger(capacity) || capacity < 1) {
      this.error.set('Revise data, horario e quantidade de vagas antes de salvar.');
      this.isSubmitting.set(false);
      return;
    }

    const eventData: EventInput = {
      title: formValue.title?.trim(),
      description: formValue.description?.trim(),
      addressId: formValue.addressId,
      category: formValue.category,
      type: formValue.type,
      organizationName: formValue.type === 'ORGANIZATION' ? formValue.organizationName?.trim() : null,
      organizationDocument: formValue.type === 'ORGANIZATION'
        ? this.stripMask(formValue.organizationDocument || '')
        : null,
      startsAt,
      endsAt,
      capacity,
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
          this.notificationsService.add('Evento atualizado', 'As alteracoes do evento foram salvas.', 'success');
        } else {
          this.eventCreated.emit(savedEvent);
          this.notificationsService.add('Evento criado', 'O evento foi criado e ja esta disponivel para inscricoes.', 'success');
        }
        this.closeModal();
      },
      error: (err) => {
        console.error('Erro ao salvar evento:', err);
        const fallback = this.isEditMode
          ? 'Falha ao atualizar evento. Tente novamente.'
          : 'Falha ao criar evento. Tente novamente.';
        this.error.set(this.extractErrorMessage(err, fallback));
        this.isSubmitting.set(false);
      }
    });
  }

  closeModal() {
    this.eventForm.reset({ category: EventCategory.SOCIAL, type: 'COMMUNITY' });
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
    if (fieldName === 'endsAt' && field?.touched && this.eventForm.errors?.['dateRange']) {
      return 'O termino deve ser depois do inicio';
    }
    if (!field || !field.errors || !field.touched) return null;

    if (field.errors['required']) return 'Este campo é obrigatório';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `Mínimo ${field.errors['min'].min}`;

    if (field.errors['pattern']) return fieldName === 'organizationDocument'
      ? 'Informe um CNPJ com 14 digitos'
      : 'Formato invalido';
    return null;
  }

  getAddressLabel(address: Address): string {
    return `${address.street}, ${address.number} - ${address.city}, ${address.state}`;
  }

  get isOrganizationEvent(): boolean {
    return this.eventForm.get('type')?.value === 'ORGANIZATION';
  }

  onOrganizationDocumentInput() {
    const control = this.eventForm.get('organizationDocument');
    if (!control) return;

    const digits = this.stripMask(control.value || '').slice(0, 14);
    const formatted = digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    control.setValue(formatted, { emitEvent: false });
  }

  private stripMask(value: string): string {
    return value.replace(/\D/g, '');
  }

  private formatDateForBackend(value: string): string | null {
    if (!value || Number.isNaN(new Date(value).getTime())) {
      return null;
    }

    return value.length === 16 ? `${value}:00` : value.slice(0, 19);
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startsAt = control.get('startsAt')?.value;
    const endsAt = control.get('endsAt')?.value;

    if (!startsAt || !endsAt) {
      return null;
    }

    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return { invalidDate: true };
    }

    return end <= start ? { dateRange: true } : null;
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) {
      return fallback;
    }

    const body = err.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body === 'object') {
      const errorBody = body as Record<string, unknown>;
      const rawMessage = String(errorBody['message'] || errorBody['error'] || errorBody['details'] || '').trim();
      const knownMessage = this.translateBackendMessage(rawMessage);

      if (knownMessage) {
        return knownMessage;
      }

      const fieldMessages = Object.values(errorBody)
        .filter(value => typeof value === 'string' && value.trim())
        .map(value => String(value));

      if (fieldMessages.length) {
        return fieldMessages.join(' ');
      }
    }

    return fallback;
  }

  private translateBackendMessage(message: string): string | null {
    if (!message) return null;
    if (message.includes('Complete your profile')) {
      return 'Complete seu perfil antes de criar um evento. Campos obrigatorios: nome, e-mail, CPF/CNPJ e telefone.';
    }
    if (message.includes('Organization events require')) {
      return 'Eventos de organizacao precisam de nome da organizacao e CNPJ.';
    }
    if (message.includes('Event end date must be after start date')) {
      return 'A data de termino deve ser depois da data de inicio.';
    }
    if (message.includes('Event start date must be in the future')) {
      return 'A data de inicio deve ser futura.';
    }
    if (message.includes('capacity')) {
      return 'Informe uma quantidade de vagas maior que zero.';
    }
    if (message.includes('address')) {
      return 'Selecione um endereco valido para o evento.';
    }
    if (message.includes('Uploaded file must be an image')) {
      return 'A imagem enviada precisa estar em um formato de imagem valido.';
    }
    return message;
  }
}
