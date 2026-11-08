import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Endereco, EnderecoRequest } from '../core/models';
import { UFS, mascaraCep } from './mascaras';

export type EnderecoForm = FormGroup<{
  cep: FormControl<string>;
  rua: FormControl<string>;
  numero: FormControl<number | null>;
  complemento: FormControl<string>;
  cidade: FormControl<string>;
  estado: FormControl<string>;
}>;

/** Mesmas regras do EnderecoRequestDTO do backend */
export function criarEnderecoForm(e?: Partial<Endereco>): EnderecoForm {
  return new FormGroup({
    cep: new FormControl(e?.cep ?? '', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)] }),
    rua: new FormControl(e?.rua ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    numero: new FormControl<number | null>(e?.numero ?? null, [Validators.required, Validators.min(1)]),
    complemento: new FormControl(e?.complemento ?? '', { nonNullable: true, validators: [Validators.maxLength(10)] }),
    cidade: new FormControl(e?.cidade ?? '', { nonNullable: true, validators: [Validators.required] }),
    estado: new FormControl(e?.estado ?? '', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)] }),
  });
}

export function valorEndereco(f: EnderecoForm): EnderecoRequest {
  const v = f.getRawValue();
  return {
    cep: v.cep,
    rua: v.rua.trim(),
    numero: Number(v.numero),
    complemento: v.complemento.trim() || null,
    cidade: v.cidade.trim(),
    estado: v.estado.toUpperCase(),
  };
}

/** Campos de endereço reutilizados em cadastro, checkout e "Meus endereços" */
@Component({
  selector: 'app-endereco-campos',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-grid" [formGroup]="grupo()">
      <div class="campo span-2" [class.invalido]="inv('cep')">
        <label>CEP</label>
        <input formControlName="cep" inputmode="numeric" placeholder="00000-000" (input)="cep($event)" />
        @if (inv('cep')) { <span class="erro-campo">CEP inválido</span> }
      </div>
      <div class="campo span-4" [class.invalido]="inv('rua')">
        <label>Rua / Avenida</label>
        <input formControlName="rua" autocomplete="address-line1" />
      </div>
      <div class="campo span-2" [class.invalido]="inv('numero')">
        <label>Número</label>
        <input formControlName="numero" type="number" min="1" />
      </div>
      <div class="campo span-4" [class.invalido]="inv('complemento')">
        <label>Complemento <span class="muted">(opcional)</span></label>
        <input formControlName="complemento" maxlength="10" placeholder="Apto 12" />
        @if (inv('complemento')) { <span class="erro-campo">Máximo de 10 caracteres</span> }
      </div>
      <div class="campo span-4" [class.invalido]="inv('cidade')">
        <label>Cidade</label>
        <input formControlName="cidade" autocomplete="address-level2" />
      </div>
      <div class="campo span-2" [class.invalido]="inv('estado')">
        <label>Estado</label>
        <select formControlName="estado">
          <option value="" disabled>UF</option>
          @for (uf of ufs; track uf) { <option [value]="uf">{{ uf }}</option> }
        </select>
      </div>
    </div>
  `,
})
export class EnderecoCampos {
  readonly grupo = input.required<EnderecoForm>();
  protected readonly ufs = UFS;

  inv(campo: keyof EnderecoForm['controls']) {
    const c = this.grupo().controls[campo];
    return c.touched && c.invalid;
  }

  cep(ev: Event) {
    const el = ev.target as HTMLInputElement;
    this.grupo().controls.cep.setValue(mascaraCep(el.value));
  }
}
