import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('dt1', { static: true }) table: Table;

  abs = Math.abs;

  buildings: any = [];
  buildingsTable: any = [];
  filterFinished = true;
  selectedBuilding;

  vehicles: any = [];

  buildingTypes = {};
  vehicleTypes = {};
  realBuildingTypes = {};

  constructor(private http: HttpClient) {
    // this.table.containerViewChild.nativeElement.addEventListener('scroll', () => {
    //   console.log("Scollolo")
    // })


    // document.getElementsByClassName('p-datatable-scrollable-view')[0].addEventListener("scroll", function (event) {

    //   var top = this.scrollY,
    //     left = this.scrollX;

    //   var horizontalScroll = document.querySelector(".horizontalScroll"),
    //     verticalScroll = document.querySelector(".verticalScroll");

    //   horizontalScroll.innerHTML = "Scroll X: " + left + "px";
    //   verticalScroll.innerHTML = "Scroll Y: " + top + "px";

    // }, false); addEventListener
  }

  ngOnInit() {
    this.defaultShit();
    this.getVehicleData();
  }

  getBuildingData() {
    let there = this;
    this.buildings = [];

    this.http.get('/api/game/buildings', { responseType: 'json' }).subscribe(data => {
      console.log(data);
      for (let i = 0; i < Object.keys(data).length; i++) {
        //for (let i = 28; i < 80; i++) {
        try {
          let building = data[i];
          const blubb = data[i].caption.split('-');
          building.type = blubb[0].trim();
          building.city = blubb[1].trim();
          building.name = (blubb[2] ? blubb[2].replace('*', '').trim() : '');
          building.vehicles = this.vehicles.filter(x => x.building_id == building.id) || [];
          building.vehicleDiff = [];
          building.personalPasst = true;

          // Get Missing Extentions
          building.extensions.forEach(ext => {
            if(this.buildingTypes[building.type].extensions && this.buildingTypes[building.type].extensions.includes(ext.type_id)) {
              ext.needed = true;
              if(ext.available == false) {
                ext.missing = true;
              } else {
                ext.missing = false;
              }
            } else {
              ext.needed = false;
              ext.missing = false;
            }
          });

          building.extensionsPasst = building.extensions.filter(x => x.needed && x.missing).length == 0;

          // if (this.buildingTypes[building.type] && this.buildingTypes[building.type].extensions && this.realBuildingTypes[building.building_type]) {
          //   building.missingExtensions = [];
          //   this.buildingTypes[building.type].extensions.forEach(ext => {
          //     const exte = building.extensions.find(x => x.type_id == ext);
          //     if (!exte || exte.available == false) {
          //       building.missingExtensions.push(ext);
          //     }
          //   });
          // }
          // building.extensionsPasst = building.missingExtensions ? (building.missingExtensions.length == 0 ? true : false) : true;

          // Schulen & KHs (1 || 3 || 8 || 10)
          if (building.building_type == 1 || building.building_type == 3 || building.building_type == 4 || building.building_type == 8 || building.building_type == 10) {
            building.level += building.extensions.length;
          }

          if (this.buildingTypes[building.type].vehicles.length > 0) {
            //let missingVehicles = [...this.buildingTypes[building.type].vehicles];
            let missingVehicles = JSON.parse(JSON.stringify(this.buildingTypes[building.type].vehicles))

            building.vehicles.forEach(existingVeh => {
              let veh = missingVehicles.find(x => x.type == existingVeh.vehicle_type);
              if (veh) {
                veh.count--;
              } else {
                missingVehicles.push({ type: existingVeh.vehicle_type, count: -1 })
              }
              existingVeh.personalPasst = this.vehicleTypes[existingVeh.vehicle_type] != null ? (existingVeh.assigned_personnel_count >= this.vehicleTypes[existingVeh.vehicle_type].minPersonal ? true : false) : false;
              if (!existingVeh.personalPasst) {
                building.personalPasst = false;
              }

              if (existingVeh.fms_real == 6) {
                building.personalPasst = false;
              }

              if (!existingVeh.assigned_personnel_count) existingVeh.assigned_personnel_count = 0;
            });

            building.vehicleDiff = missingVehicles.filter(x => x.count != 0);
          }

          if (this.buildingTypes[building.type] && building.level != this.buildingTypes[building.type].maxLevel) building.increaseLevel = true;
          else building.increaseLevel = false;

          this.buildings.push(building);
        } catch (error) {
          console.log("Fehler bei Wache: " + data[i].caption + ' ' + error);
        }
      }
      console.log(this.buildings);
      this.filterBuildings(this.filterFinished);
    })
  }

  getVehicleData() {
    this.http.get('/api/game/vehicles', { responseType: 'json' }).subscribe(data => {
      console.log(data);
      this.vehicles = data;
      this.getBuildingData();
    })
  }

  filterBuildings(yepp) {
    this.filterFinished = yepp;
    if (yepp) this.buildingsTable = this.buildings.filter(x => x.vehicleDiff.length != 0 || !x.personalPasst || x.increaseLevel || !x.extensionsPasst);
    else this.buildingsTable = this.buildings;
  }

  openBuildingTab() {
    new Audio('./assets/click.mp3').play();
    window.open('https://www.leitstellenspiel.de/buildings/' + this.selectedBuilding.id, '_blank', 'noreferrer');
  }
  openVehicleTab(vehicleId) {
    window.open(`https://www.leitstellenspiel.de/vehicles/${vehicleId}`, '_blank', 'noreferrer');
  }
  openVehiclePersonalTab(vehicleId) {
    window.open(`https://www.leitstellenspiel.de/vehicles/${vehicleId}/zuweisung`, '_blank', 'noreferrer');
  }
  openBuyVehicleTab(buildingId, vehicleId) {
    window.open(`https://www.leitstellenspiel.de/buildings/${buildingId}/vehicle/${buildingId}/${vehicleId}/credits?building=${buildingId}`, '_blank', 'noreferrer');
  }
  openVehicleStatusTab(vehicleId, status) {
    window.open(`https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/${status == 6 ? "2" : "6"}`, '_blank', 'noreferrer');
  }
  openUpgradeTab(buildingId, level) {
    window.open(`https://www.leitstellenspiel.de/buildings/${buildingId}/expand_do/credits?level=${level - 1}`, '_blank', 'noreferrer');
  }

  defaultShit() {
    // Gebäude
    // Die buildingTypes beziehen sich auf die von uns festgelegte Zahl am Anfang des Namens des Gebäudes.
    this.buildingTypes['10'] = {
      name: "Feuerwache", maxLevel: "19", vehicles: [
        { type: 2, count: 1 }, // DLK23
        { type: 3, count: 1 }, // ELW1
        { type: 5, count: 1 }, // GW-A
        { type: 10, count: 1 }, // GW-Öl
        { type: 12, count: 1 }, // GW-Mess
        { type: 14, count: 1 }, // SW2000
        { type: 27, count: 1 }, // GW-G
        { type: 30, count: 5 }, // HLF20
        { type: 33, count: 1 }, // GW-H
        { type: 34, count: 1 }, // ELW2
        { type: 53, count: 1 }, // DekonP
        { type: 57, count: 1 }, // FWK
        { type: 74, count: 1 } // NAW
      ], extensions: [0]
    };
    this.buildingTypes['11'] = {
      name: "Flughafen Feuerwehr", maxLevel: "19", vehicles: [
        { type: 2, count: 1 }, // DLK23
        { type: 3, count: 1 }, // ELW1
        { type: 30, count: 5 }, // HLF20
        { type: 75, count: 5 }, // FLF
        { type: 76, count: 2 }, // RTT
        { type: 10, count: 1 }, // GW-Öl
        { type: 5, count: 1 }, // GW-A
        { type: 34, count: 1 } // ELW2
      ], extensions: [0, 8]
    };
    this.buildingTypes['12'] = {
      name: "Werkfeuerwehr", maxLevel: "19", vehicles: [
        { type: 3, count: 1 }, // ELW1
        { type: 5, count: 1 }, // GW-A
        { type: 10, count: 1 }, // GW-Öl
        { type: 12, count: 1 }, // GW-Mess
        { type: 14, count: 1 }, // SW2000
        { type: 27, count: 1 }, // GW-G
        { type: 30, count: 5 }, // HLF20
        { type: 34, count: 1 }, // ELW2
        { type: 74, count: 1 }, // NAW
        { type: 83, count: 1 }, // GW-Werk
        { type: 84, count: 1 }, // ULF-L
        { type: 85, count: 1 }, // TM50
        { type: 86, count: 1 }, // TULF
      ], extensions: [0, 13]
    };
    this.buildingTypes['20'] = {
      name: "Rettungswache", maxLevel: "14", vehicles: [
        { type: 28, count: 7 }, // RTW
        { type: 29, count: 4 }, // NEF
        { type: 55, count: 2 }, // LNA
        { type: 56, count: 1 }, // OrgL
        { type: 74, count: 1 }  // NAW
      ]
    };
    this.buildingTypes['21'] = {
      name: "SEG", maxLevel: "0", vehicles: [
        { type: 59, count: 1 }, // ELW 1 (SEG)
        { type: 60, count: 1 }, // GW-San
        { type: 63, count: 1 }, // GW-Taucher
        { type: 64, count: 1 }, // GW-Wasserrettung
        { type: 70, count: 1 }, // MZB
        { type: 91, count: 1 } // Rettungshundefahrzeug
      ]
    };
    this.buildingTypes['22'] = {
      name: "RTH", maxLevel: "1", vehicles: [
        { type: 31, count: 1 } // RTH
      ]
    };
    this.buildingTypes['30'] = {
      name: "Polizei", maxLevel: "14", vehicles: [
        { type: 32, count: 15 } // FustW
      ]
    };
    this.buildingTypes['31'] = {
      name: "Bereitschaftspolizei", maxLevel: "0", vehicles: [
        { type: 35, count: 4 }, // leBefKw
        { type: 50, count: 9 }, // GruKw
        { type: 51, count: 5 }, // FüKw
        { type: 52, count: 1 }, // GefKw
        { type: 72, count: 3 }, // WaWe
        { type: 79, count: 6 }, // SEK - ZF
        { type: 80, count: 2 }, // SEK - MTF
        { type: 81, count: 6 }, // MEK - ZF
        { type: 82, count: 2 }, // MEK - MTF
        { type: 94, count: 3 } // DHuFüKw
      ]
    };
    this.buildingTypes['32'] = {
      name: "SEK / MEK", maxLevel: "0", vehicles: [
        { type: 51, count: 4 }, // FüKw
        { type: 79, count: 6 }, // SEK - ZF
        { type: 80, count: 2 }, // SEK - MTF
        { type: 81, count: 6 }, // MEK - ZF
        { type: 82, count: 2 }, // MEK - MTF
        { type: 94, count: 3 } // DHuFüKw
      ]
    };
    this.buildingTypes['33'] = {
      name: "POLHELI", maxLevel: "20", vehicles: [
        { type: 61, count: 1 } // Polizeihubschrauber
      ]
    };
    this.buildingTypes['40'] = {
      name: "THW", maxLevel: "20", vehicles: [ // HIER ZAHLEN EINTRAGEN
        { type: 39, count: 2 }, // GKW
        { type: 40, count: 2 }, // MTW-TZ
        { type: 41, count: 2 }, // MzKW
        { type: 42, count: 1 }, // LKW K 9
        { type: 43, count: 1 }, // BRmG R
        { type: 44, count: 1 }, // Anh DLE
        { type: 45, count: 1 }, // MLW 5
        { type: 65, count: 1 }, // LKW 7 Lkr 19 tm
        { type: 66, count: 1 }, // Anh MZB
        { type: 67, count: 1 }, // Ahn-SchlB
        { type: 68, count: 1 }, // Ahn-MzAB
        { type: 69, count: 1 }, // Tauchkraftwagen
        { type: 92, count: 2 }, // Anh Hund
        { type: 93, count: 2 } // MTW-OV

      ]
    };
    this.buildingTypes['50'] = {
      name: "DLRG", maxLevel: "1", vehicles: [
        { type: 69, count: 2 }, // Tauchkraftwagen
        { type: 66, count: 2 }, // Anh MZB
        { type: 64, count: 1 }, // GW-Wasserrettung
      ]
    };

    this.buildingTypes['80'] = { name: "Krankenhaus", maxLevel: "29", vehicles: [], extensions: [0, 1, 2, 3, 4, 5, 6, 7, 8] };

    this.buildingTypes['90'] = { name: "Schule", maxLevel: "3", vehicles: [] };
    this.buildingTypes['91'] = { name: "Schule", maxLevel: "3", vehicles: [] };
    this.buildingTypes['92'] = { name: "Schule", maxLevel: "3", vehicles: [] };
    this.buildingTypes['93'] = { name: "Schule", maxLevel: "3", vehicles: [] };

    this.buildingTypes['00'] = { name: "Leitstelle", maxLevel: "0", vehicles: [] };

    // Fahrzeuge
    this.vehicleTypes['2'] = { name: 'DLK23', minPersonal: 0 };
    this.vehicleTypes['3'] = { name: 'ELW1', minPersonal: 0 };
    this.vehicleTypes['5'] = { name: 'Gerätewagen Atemschutz', minPersonal: 0 };
    this.vehicleTypes['10'] = { name: 'Gerätewagen Öl', minPersonal: 0 };
    this.vehicleTypes['12'] = { name: 'Gerätewagen Messtechnik', minPersonal: 1 };
    this.vehicleTypes['14'] = { name: 'SW2000', minPersonal: 0 };
    this.vehicleTypes['27'] = { name: 'Gerätewagen Gefahrgut', minPersonal: 1 };
    this.vehicleTypes['30'] = { name: 'HLF20', minPersonal: 0 };
    this.vehicleTypes['33'] = { name: 'Gerätewagen Höhenrettung', minPersonal: 1 };
    this.vehicleTypes['34'] = { name: 'ELW2', minPersonal: 1 };
    this.vehicleTypes['53'] = { name: 'DekonP', minPersonal: 6 };
    this.vehicleTypes['57'] = { name: 'FwK', minPersonal: 1 };
    this.vehicleTypes['75'] = { name: 'FLF', minPersonal: 3 };
    this.vehicleTypes['76'] = { name: 'Rettungstreppe', minPersonal: 2 };
    this.vehicleTypes['83'] = { name: 'GW-Werk', minPersonal: 3 };
    this.vehicleTypes['84'] = { name: 'ULF-L', minPersonal: 3 };
    this.vehicleTypes['85'] = { name: 'TM50', minPersonal: 3 };
    this.vehicleTypes['86'] = { name: 'TULF', minPersonal: 3 };

    this.vehicleTypes['28'] = { name: 'RTW', minPersonal: 0 };
    this.vehicleTypes['29'] = { name: 'NEF', minPersonal: 1 };
    this.vehicleTypes['55'] = { name: 'LNA', minPersonal: 1 };
    this.vehicleTypes['56'] = { name: 'OrgL', minPersonal: 1 };
    this.vehicleTypes['58'] = { name: 'KTW-B', minPersonal: 0 };
    this.vehicleTypes['59'] = { name: 'ELW 1 (SEG)', minPersonal: 1 };
    this.vehicleTypes['60'] = { name: 'GW-San', minPersonal: 6 };
    this.vehicleTypes['63'] = { name: 'GW-Taucher', minPersonal: 2 };
    this.vehicleTypes['64'] = { name: 'GW-Wasserrettung', minPersonal: 1 };
    this.vehicleTypes['70'] = { name: 'MZB', minPersonal: 0 };
    this.vehicleTypes['74'] = { name: 'NAW', minPersonal: 1 };
    this.vehicleTypes['91'] = { name: 'Hund', minPersonal: 4 };

    this.vehicleTypes['32'] = { name: 'FustW', minPersonal: 0 };
    this.vehicleTypes['35'] = { name: 'leBefKw', minPersonal: 1 };
    this.vehicleTypes['51'] = { name: 'GruKw', minPersonal: 1 };
    this.vehicleTypes['52'] = { name: 'GefKw', minPersonal: 2 };
    this.vehicleTypes['72'] = { name: 'WaWe', minPersonal: 5 };
    this.vehicleTypes['79'] = { name: 'SEK - ZF', minPersonal: 3 };
    this.vehicleTypes['80'] = { name: 'SEK - MTF', minPersonal: 9 };
    this.vehicleTypes['81'] = { name: 'MEK - ZF', minPersonal: 3 };
    this.vehicleTypes['82'] = { name: 'MEK - MTF', minPersonal: 9 };
    this.vehicleTypes['94'] = { name: 'DHuFüKw', minPersonal: 1 };

    this.vehicleTypes['39'] = { name: 'GKW', minPersonal: 1 }; //MIN PERSONAL ÄNMDERN
    this.vehicleTypes['40'] = { name: 'MTW-TZ', minPersonal: 1 };
    this.vehicleTypes['41'] = { name: 'MzKW', minPersonal: 1 };
    this.vehicleTypes['42'] = { name: 'LKW K 9', minPersonal: 1 };
    this.vehicleTypes['43'] = { name: 'BRmG R', minPersonal: 1 };
    this.vehicleTypes['44'] = { name: 'Anh DLE', minPersonal: 1 };
    this.vehicleTypes['45'] = { name: 'MLW 5', minPersonal: 1 };
    this.vehicleTypes['65'] = { name: 'LKW 7 Lkr 19 tm', minPersonal: 1 };
    this.vehicleTypes['66'] = { name: 'Anh MZB', minPersonal: 1 };
    this.vehicleTypes['67'] = { name: 'Ahn-SchlB', minPersonal: 0 };
    this.vehicleTypes['68'] = { name: 'Ahn-MzAb', minPersonal: 0 };
    this.vehicleTypes['69'] = { name: 'Tauchkraftwagen', minPersonal: 1 };
    this.vehicleTypes['92'] = { name: 'Anh Hund', minPersonal: 1 };
    this.vehicleTypes['93'] = { name: 'MTW-OV', minPersonal: 1 };

    this.realBuildingTypes['0'] = {
      name: "Feuerwache", extensions: {
        0: "Rettungsdienst",
        8: "Flughafenfeuerwehr",
        13: "Werkfeuerwehr"
      }
    };

    this.realBuildingTypes['4'] = {
      name: "Krankenhaus", extensions: {
        0: "Allgemeine Innere",
        1: "Allgemeine Chirugie",
        2: "Gynäkologie",
        3: "Urologie",
        4: "Unfallchirugie",
        5: "Neurologie",
        6: "Neurochirugie",
        7: "Kardiologie",
        8: "Kardiochirugie",
        9: "Test"
      }
    };

  }

}
