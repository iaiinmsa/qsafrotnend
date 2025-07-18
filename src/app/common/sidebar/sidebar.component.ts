import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { ToggleService } from './toggle.service';
import { CommonModule, isPlatformBrowser, NgClass } from '@angular/common';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { StorageService } from '../../authentication/storage.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    imports: [NgScrollbarModule, MatExpansionModule,
         RouterLinkActive, RouterModule, RouterLink,
          NgClass , CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

    // isSidebarToggled
    isSidebarToggled = false;

    // isToggled
    isToggled = false;
    userRoles: string[] = []; // Para almacenar los roles del usuario
    private rolesSubscription: Subscription | undefined; // Para manejar la suscripción


    constructor(
        private toggleService: ToggleService,
        public themeService: CustomizerSettingsService,
        private storageService: StorageService, // Inyecta StorageService
 
     
    ) {
        this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
            this.isSidebarToggled = isSidebarToggled;
        });
        this.themeService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });
    }


    ngOnInit(): void {
        this.userRoles = this.storageService.getUserRoles(); // Usar StorageService
        console.log('SidebarComponent: User roles cargados vía StorageService:', this.userRoles);
     
        this.rolesSubscription = this.storageService.userRoles$.subscribe(roles => {
            this.userRoles = roles;
            console.log('SidebarComponent: Roles actualizados desde Observable:', this.userRoles);
            // Angular detectará los cambios en userRoles y actualizará la vista si es necesario
        });

    }

    hasRole(roleName: string): boolean {
        return this.userRoles.includes(roleName);
    }

    // Burger Menu Toggle
    toggle() {
        this.toggleService.toggle();
    }

           // Método para borrar currentUserEmail de localStorage
           clearUserEmailFromStorage(): void {
            console.log('Eliminando datos de sesión del usuario vía StorageService...');
            this.storageService.clearUserSession(); // Usar StorageService
            this.userRoles = []; // Resetea localmente
         
            // console.log('currentUserEmail ha sido eliminado del localStorage.');
            // La navegación a /authentication/logout continuará normalmente debido al routerLink.
        }


        ngOnDestroy(): void {
            // Desuscribirse para evitar fugas de memoria
            if (this.rolesSubscription) {
                this.rolesSubscription.unsubscribe();
            }
        }

        

    // Mat Expansion
    panelOpenState = false;

}