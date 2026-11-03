/** Passive UIKit view. Owns layout and intent events; all game decisions belong to Main/State.
 * CLAD composition helpers adapted from the Apache-2.0 Snap toolkit. */
import {BackPlate} from 'SpectaclesUIKit.lspkg/Scripts/BackPlate';
import {Button} from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/Button';
import {ElementContent} from 'SpectaclesUIKit.lspkg/Scripts/Components/Content/ElementContent';
import {FlexLayout} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout';
import {FlexItem} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem';
import {FlexDirection,FlexAlign,FlexJustify,FlexAlignSelf} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes';
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event';
import {Snapshot} from './RoomInvadersState';
const PLAY=requireAsset('../Icons/play_arrow.png') as Texture;
const RESTART=requireAsset('../Icons/restart_alt.png') as Texture;
const TYPE_SCALE={Title2:{size:93,weight:700},Body:{size:39,weight:500},Caption:{size:38,weight:500}};
function applyTextRole(t:Text,role:keyof typeof TYPE_SCALE,scale:number):void {
  t.size=TYPE_SCALE[role].size*scale;(t as Text&{weight?:number}).weight=TYPE_SCALE[role].weight;
}
@component
export class RoomInvadersHUDUI extends BaseScriptComponent {
  @ui.label('Room Invaders — world-space controls')
  @ui.separator
  @input @hint('Panel width in centimeters') @widget(new SliderWidget(42,75,1)) width:number=60;
  @input @hint('Scale the shared typography roles') @widget(new SliderWidget(0.8,1.4,0.05)) textScale:number=1.2;
  @input @hint('Title shown over the encounter') title:string='ROOM INVADERS';
  @input @hint('Initial instruction') readyMessage:string='Point at a creature. Pinch to zap. Save Pip!';
  @input('vec4','{0.8,1,0.98,1}') @widget(new ColorWidget()) @hint('Bright guidance color') textColor:vec4;
  public onManual=new Event<void>();
  public onPrimary=new Event<void>();
  public onReposition=new Event<void>();
  public onRestart=new Event<void>();
  private stats:Text;
  private compactStats:Text;
  private compactGuidance:Text;
  private menu:SceneObject;
  private compact:SceneObject;
  private menuRequested=true;
  private guidance:Text;
  private primaryLabel:ElementContent;
  private latest:Snapshot;
  private placing=false;
  private placed=0;
  private automatic=true;
  private message='';
  onAwake():void {this.createEvent('OnStartEvent').bind(()=>this.build());}
  private build():void {
    this.sceneObject.createComponent('Component.Canvas');
    this.menu=this.obj(this.sceneObject,'ExpandedMenu');
    const plate=this.menu.createComponent(BackPlate.getTypeName()) as BackPlate;
    const content=this.obj(this.menu,'Content',new vec3(0,0,0.6));
    const col=this.flexColumn(content,this.width,19,{gap:0.6,padX:1.5,padY:1.1});
    const layout=col.getComponent(FlexLayout.getTypeName()) as FlexLayout;
    layout.onLayoutComplete.add(r=>plate.size=new vec2(r.containerWidth,r.containerHeight));
    this.flexChild(col,{w:this.width-3,h:3.4},so=>this.label(so,'Title',this.title,'Title2'));
    this.flexChild(col,{w:this.width-3,h:2.5},so=>{this.stats=this.label(so,'Stats','90s   •   0000 points   •   5 shields','Body');});
    this.flexChild(col,{w:this.width-3,h:3.2},so=>{this.guidance=this.label(so,'Guidance',this.readyMessage,'Caption');});
    this.flexChild(col,{w:this.width-3,h:4},row=>{
      const f=row.createComponent(FlexLayout.getTypeName()) as FlexLayout;
      f.onInitialized.add(()=>{f.direction=FlexDirection.Row;f.width=this.width-3;f.height=4;f.columnGap=2;f.justifyContent=FlexJustify.Center;});
      this.flexChild(row,{w:19,h:3.6},so=>{this.primaryLabel=this.button(so,'Start',PLAY,()=>this.onPrimary.invoke());});
      this.flexChild(row,{w:19,h:3.6},so=>{this.button(so,'Restart',RESTART,()=>this.onRestart.invoke());});
    });
    this.flexChild(col,{w:this.width-3,h:4},row=>{
      const f=row.createComponent(FlexLayout.getTypeName()) as FlexLayout;
      f.onInitialized.add(()=>{f.direction=FlexDirection.Row;f.width=this.width-3;f.height=4;f.columnGap=2;f.justifyContent=FlexJustify.Center;});
      this.flexChild(row,{w:23,h:3.6},so=>{this.button(so,'Rescan room',RESTART,()=>this.onReposition.invoke());so.name='Room setupButton';});
      this.flexChild(row,{w:23,h:3.6},so=>this.button(so,'Place myself',RESTART,()=>this.onManual.invoke()));
    });
    this.compact=this.obj(this.sceneObject,'GameplayHUD',new vec3(0,8,0));
    const compactPlate=this.compact.createComponent(BackPlate.getTypeName()) as BackPlate;
    const compactContent=this.obj(this.compact,'Content',new vec3(0,0,0.6));
    const compactCol=this.flexColumn(compactContent,48,7.8,{gap:0.4,padX:1,padY:0.5});
    (compactCol.getComponent(FlexLayout.getTypeName()) as FlexLayout).onLayoutComplete.add(r=>compactPlate.size=new vec2(r.containerWidth,r.containerHeight));
    this.flexChild(compactCol,{w:46,h:3.6},row=>{
      const f=row.createComponent(FlexLayout.getTypeName()) as FlexLayout;
      f.onInitialized.add(()=>{f.direction=FlexDirection.Row;f.width=46;f.height=3.6;f.columnGap=1;f.justifyContent=FlexJustify.Center;});
      this.flexChild(row,{w:32,h:3.6},so=>{this.compactStats=this.label(so,'CompactStats','','Body');this.compactStats.size=39;});
      this.flexChild(row,{w:12,h:3.6},so=>{
        const label=this.button(so,'Menu',PLAY,()=>{this.menuRequested=true;if(this.latest?.paused)this.render(this.latest,this.message,this.placing,this.placed,this.automatic);else this.onPrimary.invoke();});
        so.name='PauseMenuButton';
        (so.getComponent(Button.getTypeName()) as Button).size=new vec3(12,3.6,1);
        label.sizeOverride=new vec2(11,3);label.textSize=39;
      });
    });
    this.flexChild(compactCol,{w:46,h:2.3},so=>{this.compactGuidance=this.label(so,'CompactGuidance','','Caption');this.compactGuidance.size=38;});
    this.compact.enabled=false;
    if(this.latest) this.render(this.latest,this.message,this.placing,this.placed,this.automatic);
  }
  render(s:Snapshot,message:string,placing=false,placed=3,automatic=true):void {
    this.automatic=automatic;this.placing=placing;this.placed=placed;
    this.latest=s;this.message=message;
    if(!this.stats) return;
    this.stats.text=Math.ceil(s.remaining)+'s   •   '+s.score+' points   •   '+s.health+' shields';
    this.guidance.text=message||this.readyMessage;
    if(s.phase==='playing'&&!s.paused)this.menuRequested=false;
    const expanded=s.phase!=='playing'||(s.paused&&this.menuRequested);
    // Disable the complete subtree, including UIKit interactables, not just its rendered backplate.
    this.menu.enabled=expanded;this.compact.enabled=!expanded;
    this.compactStats.text=this.stats.text;
    this.compactGuidance.text=message.startsWith('ZAP!')?message:s.paused?'Paused':s.rescue==='locked'?'SAVE PIP · Pinch the three violet locks':s.rescue==='free'?'PIP IS FREE · Pinch Pip to rescue':s.rescue==='saved'?'Pip saved · Keep defending':'Look all around · Fast hits earn more';
    if(placing)this.stats.text='ROOM SETUP   •   '+placed+' / 3 hiding spots found';
    this.primaryLabel.text=placing?(automatic?'Scanning…':'Place spots'):s.phase==='ready'?'Start':s.phase==='finished'?'Play again':s.paused?'Resume':'Pause';
  }
  private label(so:SceneObject,name:string,value:string,role:keyof typeof TYPE_SCALE):Text {
    so.name=name;const t=so.createComponent('Component.Text') as Text;
    t.text=value;t.depthTest=true;applyTextRole(t,role,this.textScale);t.textFill.color=this.textColor;
    t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;
    t.horizontalOverflow=HorizontalOverflow.Overflow;t.verticalOverflow=VerticalOverflow.Overflow;
    t.layoutRect=Rect.create(-0.5,0.5,-0.5,0.5);
    (so.getComponent(FlexItem.getTypeName()) as FlexItem).alignSelf=FlexAlignSelf.Stretch;
    return t;
  }
  private button(so:SceneObject,label:string,icon:Texture,callback:()=>void):ElementContent {
    so.name=label+'Button';const b=so.createComponent(Button.getTypeName()) as Button;
    b.size=new vec3(19,3.6,1);b.onTriggerUp.add(callback);
    const c=this.obj(so,'Label',new vec3(0,0,0.08));
    const ec=c.createComponent(ElementContent.getTypeName()) as ElementContent;
    ec.text=label;ec.leadingIcon=icon;ec.textSize=39*this.textScale;ec.sizeOverride=new vec2(17.5,3);
    return ec;
  }
  private obj(parent:SceneObject,name:string,position?:vec3):SceneObject {
    const so=global.scene.createSceneObject(name);so.setParent(parent);
    if(position) so.getTransform().setLocalPosition(position);return so;
  }
  private liftInZ(so:SceneObject,z:number):void {
    const t=so.getTransform(),p=t.getLocalPosition();t.setLocalPosition(new vec3(p.x,p.y,p.z+z));
  }
  private flexColumn(parent:SceneObject,width:number,height:number,opts?:{gap?:number,padY?:number,padX?:number,justify?:FlexJustify,align?:FlexAlign}):SceneObject {
    const container=this.obj(parent,'Flex');this.liftInZ(container,0.02);
    const f=container.createComponent(FlexLayout.getTypeName()) as FlexLayout;
    const item=container.createComponent(FlexItem.getTypeName()) as FlexItem;
    if(width>0)item.overrideWidth=width;if(height>0)item.overrideHeight=height;
    f.onInitialized.add(()=>{f.width=width;f.height=height;f.direction=FlexDirection.Column;
      f.rowGap=opts?.gap??0;f.paddingTop=opts?.padY??0;f.paddingBottom=opts?.padY??0;
      f.paddingLeft=opts?.padX??0;f.paddingRight=opts?.padX??0;f.justifyContent=opts?.justify??FlexJustify.Start;
      f.alignItems=opts?.align??FlexAlign.Stretch;});return container;
  }
  private flexChild(parent:SceneObject,size:{w?:number,h?:number,grow?:number},builder:(so:SceneObject)=>void):SceneObject {
    const child=this.obj(parent,'Item');this.liftInZ(child,0.02);
    const item=child.createComponent(FlexItem.getTypeName()) as FlexItem;
    if(size.w!==undefined&&size.w>0)item.overrideWidth=size.w;
    if(size.h!==undefined&&size.h>0)item.overrideHeight=size.h;
    item.flexGrow=size.grow??0;item.flexShrink=0;builder(child);
    const f=parent.getComponent(FlexLayout.getTypeName()) as FlexLayout;if(f)f.onInitialized.add(()=>f.addItems([item]));return child;
  }
}
