import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProfileFileTransferService } from '../../services/profile-file-transfer.service';

@Component({
  selector: 'app-private-profile-create',
  templateUrl: './private-profile-create.component.html',
  styleUrls: ['./private-profile-create.component.css']
})
export class PrivateProfileCreateComponent implements OnInit{
  profileForm = this.fb.group({
    status: ['', Validators.required],
    bio: ['', Validators.required],
    city: ['', Validators.required],
    url: ['', Validators.required],
    gender: ['', Validators.required],
    avatar: [null, Validators.required],
  });
  selectedFile!: File;
  imageUrl!: string;
  constructor(
    private fb: FormBuilder,private dialogRef: MatDialogRef<PrivateProfileCreateComponent>,@Inject(MAT_DIALOG_DATA) data: any, private pFileTransferService: ProfileFileTransferService) {}

  ngOnInit(): void {
  }
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    console.log(this.selectedFile);

    this.imageUrl = URL.createObjectURL(this.selectedFile);
    this.pFileTransferService.avatar = this.selectedFile;
  }
  onClose() {
    this.dialogRef.close();
  }
  onSave() {

    this.dialogRef.close({data:this.profileForm.value});

  }
}
