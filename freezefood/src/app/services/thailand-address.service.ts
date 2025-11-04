import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Province {
  id: number;
  name_th: string;
}

export interface District {
  id: number;
  name_th: string;
  province_id: number;
}

export interface SubDistrict {
  id: number;
  zip_code: string;
  name_th: string;
  amphure_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ThailandAddressService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ดึงจังหวัดทั้งหมด
  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.apiUrl}/provinces`);
  }

  // ดึงอำเภอตามจังหวัด
  getDistricts(provinceId: number): Observable<District[]> {
    return this.http.get<District[]>(`${this.apiUrl}/districts/${provinceId}`);
  }

  // ดึงตำบลตามอำเภอ
  getSubDistricts(districtId: number): Observable<SubDistrict[]> {
    return this.http.get<SubDistrict[]>(`${this.apiUrl}/subdistricts/${districtId}`);
  }
}
