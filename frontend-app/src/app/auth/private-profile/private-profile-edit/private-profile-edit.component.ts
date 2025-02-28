import { Component, OnInit } from '@angular/core';
import { Profile } from '../../models/profile';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ProfileHTTPService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { ProfileFileTransferService } from '../../services/profile-file-transfer.service';

@Component({
  selector: 'app-private-profile-edit',
  templateUrl: './private-profile-edit.component.html',
  styleUrls: ['./private-profile-edit.component.css']
})
export class PrivateProfileEditComponent implements OnInit{
  profileId!: number;
  profile!: Profile;
  profileForm!: FormGroup;
  user_id!: number;
  selectedFile!: File;
  imageUrl!: string;
  constructor(
    private route: ActivatedRoute,
    private pService: ProfileHTTPService,
    private router: Router,
    private authService: AuthService,
    private pFileTransferService: ProfileFileTransferService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.profileId = +params['profileId'];
    });
    this.authService.user().subscribe((result: any) => {
      this.user_id = result["id"];
    })
    this.pService.fetchPrivateProfileById(this.profileId).subscribe((profile: Profile) => {
      this.profile = {...profile}
    });
    setTimeout(() => {
      this.initForm();
    },250);
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.imageUrl = URL.createObjectURL(this.selectedFile);
    this.pFileTransferService.avatar = this.selectedFile;
  }
  onSubmit() {
    console.log(this.profileForm.value);
    const imageformData = new FormData();
    if (!!this.pFileTransferService.avatar) {
      imageformData.append('avatar', this.pFileTransferService.avatar);
    }

    const profileForm = new FormData();
    profileForm.append('id', this.profile.id);
    profileForm.append('status', this.profileForm.value["status"]);
    profileForm.append('bio', this.profileForm.value["bio"]);
    profileForm.append('city', this.profileForm.value["city"]);
    profileForm.append('gender', this.profileForm.value["gender"]);
    profileForm.append('url', this.profileForm.value["url"]);
    profileForm.append('user', this.user_id.toString());
    setTimeout(() => {

      this.pService.updateProfile(this.profileId, profileForm).subscribe((result:any) => {
        console.log(result);
        if (!!this.pFileTransferService.avatar) {
          this.pService.addProfileImage(result.id,imageformData).subscribe(() => {
            console.log("profile image updated");
            this.pFileTransferService.avatar = null;
          })
        }
      });
    }, 100);
    this.router.navigateByUrl("/profile/personal");
  }


  onCancel() {

    this.router.navigateByUrl("/profile/personal")
    .then(() => {
      window.location.reload();
    });
  }

  private initForm() {
    let profileStatus = '';
    let profileBio = '';
    let profileGender = '';
    let profileAvatar = null;
    let profileURL = '';
    let profileCity = '';
    let profileUser = this.user_id;


    profileStatus = this.profile.status;
    profileBio = this.profile.bio;
    profileGender = this.profile.gender;
    profileAvatar = this.profile.avatar;
    profileURL = this.profile.url;
    profileCity = this.profile.city;


    this.profileForm = new FormGroup({
      status: new FormControl(profileStatus, Validators.required),
      bio: new FormControl(profileBio, Validators.required),
      avatar: new FormControl(profileAvatar, Validators.required),
      url: new FormControl(profileURL, Validators.required),
      city: new FormControl(profileCity, Validators.required),
      gender: new FormControl(profileGender, Validators.required),
      user: new FormControl(profileUser, Validators.required)
    });
  }
}
