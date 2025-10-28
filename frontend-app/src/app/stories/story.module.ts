import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { StoryListComponent } from './story-list/story-list.component';
import { StoryItemComponent } from './story-list/story-item/story-item.component';
import { StoryNewComponent } from './story-new/story-new.component';
import { StoryEditComponent } from './story-edit/story-edit.component';
import { StoriesComponent } from './stories.component';
import { CommonModule } from '@angular/common';
import { ReelItemComponent } from './reel/reel-list/reel-item/reel-item.component';
import { ReelDetailComponent } from './reel/reel-detail/reel-detail.component';
import { ReelDialogComponent } from './reel/reel-dialog/reel-dialog.component';
import { ReelListComponent } from './reel/reel-list/reel-list.component';
import { RouterModule } from '@angular/router';
import { StoryDetailComponent } from './story-detail/story-detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StoryNewPartaComponent } from './story-new/story-new-parta/story-new-parta.component';
import { StoryNewPartbComponent } from './story-new/story-new-partb/story-new-partb.component';
import { MatStepperModule } from '@angular/material/stepper';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { StoryNewReelComponent } from './story-new/story-new-reel/story-new-reel.component';
import { ReelPersonalComponent } from './reel/reel-personal/reel-personal.component';
import { StoryPushedComponent } from './story-pushed/story-pushed.component';
import { PushedItemComponent } from './story-pushed/pushed-item/pushed-item.component';
import { StoryCommentItemComponent } from './story-comment-item/story-comment-item.component';
import { StoryCommentCreateComponent } from './story-comment-create/story-comment-create.component';
import { PushedDetailComponent } from './story-pushed/pushed-detail/pushed-detail.component';
import { PushedReelItemComponent } from './story-pushed/pushed-reel-item/pushed-reel-item.component';
import { PushedReelDetailComponent } from './story-pushed/pushed-reel-detail/pushed-reel-detail.component';
import { ReelCommentCreateComponent } from './reel-comment-create/reel-comment-create.component';
import { ReelCommentItemComponent } from './reel-comment-item/reel-comment-item.component';
import { ReactionInfoDialogComponent } from './reaction-info-dialog/reaction-info-dialog.component';
import {MatGridListModule} from '@angular/material/grid-list';
import {  MatInputModule } from "@angular/material/input";
import { ReelImageEditComponent } from './story-new/reel-image-edit/reel-image-edit.component';
import { StoryImageEditComponent } from './story-edit/story-image-edit/story-image-edit.component';
import { StoryEditPartaComponent } from './story-edit/story-edit-parta/story-edit-parta.component';
import { StoryEditPartbComponent } from './story-edit/story-edit-partb/story-edit-partb.component';
import { ReelEditComponent } from './story-edit/reel-edit/reel-edit.component';
import { ImageEditorComponent } from './image-editor/image-editor.component';
import { CanvasComponent } from './image-editor/canvas/canvas.component';
import { ToolbarComponent } from './image-editor/toolbar/toolbar.component';
import { FilterToolComponent } from './image-editor/toolbar/filter-tool/filter-tool.component';
import { MainToolComponent } from './image-editor/toolbar/main-tool/main-tool.component';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatMenuModule} from '@angular/material/menu';
import { CropToolsComponent } from './image-editor/toolbar/crop-tools/crop-tools.component';
import { TextToolsComponent } from './image-editor/toolbar/text-tools/text-tools.component';
import { ShapeMaskToolsComponent } from './image-editor/toolbar/shape-mask-tools/shape-mask-tools.component';
import { SharedModule } from './shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AiToolsComponent } from './image-editor/toolbar/ai-tools/ai-tools.component';
import { ThumbnailVideoComponent } from './story-pushed/pushed-item/thumbnail-video/thumbnail-video.component';

@NgModule({
  declarations: [
    StoriesComponent,
    StoryListComponent,
    StoryItemComponent,
    StoryNewComponent,
    StoryEditComponent,
    StoryDetailComponent,
    ReelItemComponent,
    ReelDetailComponent,
    ReelDialogComponent,
    ReelListComponent,
    StoryNewReelComponent,
    StoryNewPartaComponent,
    StoryNewPartbComponent,
    ReelPersonalComponent,
    StoryPushedComponent,
    PushedItemComponent,
    StoryCommentItemComponent,
    StoryCommentCreateComponent,
    PushedDetailComponent,
    PushedReelItemComponent,
    PushedReelDetailComponent,
    ReelCommentCreateComponent,
    ReelCommentItemComponent,
    ReactionInfoDialogComponent,
    ReelImageEditComponent,
    StoryImageEditComponent,
    StoryEditPartaComponent,
    StoryEditPartbComponent,
    ReelEditComponent,
    ImageEditorComponent,
    CanvasComponent,
    ToolbarComponent,
    FilterToolComponent,
    MainToolComponent,
    CropToolsComponent,
    TextToolsComponent,
    ShapeMaskToolsComponent,
    AiToolsComponent,
    ThumbnailVideoComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    SharedModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatStepperModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatInputModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    DragDropModule,
    
  ],
  exports: [
    MatStepperModule,
    MatDialogModule,
    MatIconModule,
    StoriesComponent,
    StoryListComponent,
    StoryItemComponent,
    MatSnackBarModule,
    StoryNewComponent,
    StoryEditComponent,
    StoryDetailComponent,
    ReelItemComponent,
    ReelDetailComponent,
    ReelDialogComponent,
    ReelListComponent,
    StoryNewPartaComponent,
    StoryNewPartbComponent,
    AiToolsComponent,
    ThumbnailVideoComponent
  ]
})
export class StoryModule { }
