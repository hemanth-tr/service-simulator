import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { ServiceListComponent } from './service/list/service-list.components';
import { ServiceDetailComponent } from './service/detail/service-detail.component';
import { ServiceTestComponent } from './service/test/service-test.component';
import { ServiceEditResponseComponent } from './service/edit/service-edit-response.component';
import { XmlPipe } from './XmlPipe';
import { ServiceProcessedRequestComponent } from './service/processedrequests/service-processedrequests.component';
import { ServiceViewProcessedRequestComponent } from './service/processedrequests/service-view-processedrequest/service-view-processedrequest.component';


@NgModule({
  declarations: [
    AppComponent,
    ServiceListComponent,
    ServiceDetailComponent,
    ServiceTestComponent,
    ServiceEditResponseComponent,
    ServiceProcessedRequestComponent,
    ServiceViewProcessedRequestComponent,
    XmlPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: 'services', component: ServiceListComponent },
      { path: 'hosts/:name/newresponse', component: ServiceEditResponseComponent },
      { path: 'hosts/:name/newresponse/:mapname', component: ServiceEditResponseComponent },
      { path: 'hosts/:name/:mapname/test', component: ServiceTestComponent },
      { path: 'services/:name', component: ServiceDetailComponent },
      { path: 'services/:name/processedrequests', component: ServiceProcessedRequestComponent },
      { path: 'services/:name/processedrequests/:id', component: ServiceViewProcessedRequestComponent },
      { path: '', component: ServiceListComponent },
      { path: '*', component: ServiceListComponent },
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
