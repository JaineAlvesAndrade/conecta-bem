import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent {
  team = [
    { name: 'Jaíne Andrade',    initials: 'JA' },
    { name: 'Victor Kruger',    initials: 'VK' },
    { name: 'Ralf Domingues',   initials: 'RD' },
    { name: 'Pedro Hennig',     initials: 'PH' },
    { name: 'Felipe Oliveira',  initials: 'FO' },
  ];

  values = [
    {
      icon: 'favorite',
      title: 'Empatia',
      description: 'Colocamos as pessoas no centro de cada decisão, entendendo as necessidades reais de ONGs e voluntários.'
    },
    {
      icon: 'handshake',
      title: 'Conexão',
      description: 'Acreditamos que o encontro entre quem quer ajudar e quem precisa de ajuda transforma comunidades.'
    },
    {
      icon: 'verified',
      title: 'Confiança',
      description: 'Transparência e segurança em cada interação, para que organizações e voluntários possam agir com tranquilidade.'
    },
    {
      icon: 'diversity_3',
      title: 'Inclusão',
      description: 'A plataforma é para todos: diferentes causas, diferentes perfis, um mesmo propósito.'
    },
    {
      icon: 'bolt',
      title: 'Simplicidade',
      description: 'Menos burocracia, mais ação. Cada funcionalidade existe para destravar o voluntariado, não para complicá-lo.'
    },
    {
      icon: 'public',
      title: 'Impacto',
      description: 'Medimos nosso sucesso pelo bem gerado nas comunidades — cada voluntário conectado é uma história transformada.'
    },
  ];
}