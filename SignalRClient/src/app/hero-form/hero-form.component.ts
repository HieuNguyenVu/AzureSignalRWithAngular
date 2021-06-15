import { Component, OnInit } from '@angular/core';
import { Hero } from '../hero';
import { HttpClient } from '@angular/common/http';
import { domain } from 'process';

declare var apiBaseUrl;
declare var signalR;

export interface Message {
  from: string;
  timestamp: string;
  message: string;
}

@Component({
  selector: 'app-hero-form',
  templateUrl: './hero-form.component.html',
  styleUrls: ['./hero-form.component.scss']
})
export class HeroFormComponent implements OnInit {

  powers = ['Really Smart', 'Super Flexible',
    'Super Hot', 'Weather Changer'];

  model = new Hero(18, 'Dr IQ', this.powers[0], 'Chuck Overstreet');

  submitted = false;

  msgs: Message[] = [];

  counter = 0;

  newMessage = '';
  ready = false

  owner;
  lockName = false;
  lockPower = false;
  lockAlterEgo = false;
  constructor(private http: HttpClient) {
    this.owner = prompt('Enter your username');
  }

  onSubmit() { this.submitted = true; }

  // TODO: Remove this when we're done
  get diagnostic() { return JSON.stringify(this.model); }
  onCheckboxChange(event, domId) {
    console.log(event.target.checked);
    this.sendMessage(this.owner,
      {
        domId,
        lock: event.target.checked
      });
  }

  getLockByDomId(domId, value) {
    if (domId === 'name') {
      this.lockName = value;
    }
    if (domId === 'alterEgo') {
      this.lockAlterEgo = value;
    }
    if (domId === 'power') {
      this.lockPower = value;
    }
  }

  ngOnInit(): void {
    const self = this;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:7071/api`)
      .configureLogging(signalR.LogLevel.Information)
      .build();
    connection
    connection.on('newMessage', (message) => {
      console.log('Message', message);
      let element = <HTMLInputElement>document.getElementById(message.data.domId);
      if(message.sender === self.owner) return;
      if (message.data.lock === true) {
        element.value = "";
        element.placeholder = `Lock by ${message.sender}`;
      } else {
        element.placeholder = "";
      }
      element.disabled = message.data.lock;
      self.getLockByDomId(message.data.domId, message.data.lock);

    });
    connection.onclose(() => console.log('disconnected'));

    console.log('connecting...');

    connection.start()
      .then(() => self.ready = true)
      .catch(console.error);
  }

  sendMessage(sender, messageText) {
    return this.http.post(`http://localhost:7071/api/messages`, {
      sender: sender,
      data: messageText
    }).toPromise().then((resp: any) => console.log('SOMETHING', resp));
  }
}