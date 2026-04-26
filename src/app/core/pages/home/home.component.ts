import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, StatCardComponent, MatIconModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  
  // Usando o signal do AuthService diretamente
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  stats = [
    {
      value: '2.500+',
      label: 'Voluntários Ativos',
      icon: 'people'
    },
    {
      value: '50+',
      label: 'Projetos Realizados',
      icon: 'favorite'
    },
    {
      value: '10.000+',
      label: 'Vidas Impactadas',
      icon: 'public'
    },
    {
      value: '15',
      label: 'Cidades Atendidas',
      icon: 'location_city'
    }
  ];

  pillars = [
    {
      title: 'Nossa Missão',
      desc: 'Facilitar o encontro entre voluntários e organizações para maximizar o impacto social positivo.',
      icon: 'flag'
    },
    {
      title: 'Nossa Visão',
      desc: 'Ser a principal plataforma de voluntariado do Brasil, transformando vidas através da solidariedade.',
      icon: 'visibility'
    },
    {
      title: 'Nossos Valores',
      desc: 'Transparência, inclusão, respeito e compromisso com o impacto social sustentável.',
      icon: 'favorite_border'
    }
  ];

  ngOnInit() {
  }
}