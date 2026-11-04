# Frame fastening and comb alignment update

2026-11-04. This update supersedes the frame and pending-comb sections of the dated October assembly notes. It retains the 14-layer, 28-column, 1,736-magnet baseline and existing magnetic solver.

Stage 8 now shows the holders being bolted to the aluminium profiles. Eight frame-side holes per layer are measured from the registered support CAD: three at each side support and two at the lower support. The animation seats the layer, places the matching T-slot nuts, inserts the mounting bolts and then illustrates tightening. Hole diameter alone is not used to infer the bolt thread, head, length or tightening torque. The mounting hardware remains the supplied configuration.

第 8 步明确展示支撑与铝型材的螺栓连接。孔位来自现有支撑 CAD：左右支撑各三个，底部两个，每层共八处。动作依次为磁层落位、T 型槽螺母就位、螺栓插入与紧固。孔径不被擅自当成螺纹规格。

Stage 11 follows the corrected continuous-comb interpretation shown in the user's photograph: six complete axial comb assemblies, three on the upper semicircle and three on the lower. Every assembly has a continuous backbone spanning all fourteen layers and thirteen internal teeth engaging the thirteen inter-layer gaps. The total is 6 comb assemblies and 78 internal tooth contact features. Physical comb quantity is counted by complete assemblies.

The supplied comb STEP contains two reference profiles: four 20 mm slots at 38 mm pitch in a 170 mm body, and five slots at the same pitch in a 208 mm body. Both use 18 mm teeth. The teaching rail retains the source tooth and backbone cross-sections while extending the pattern across the fourteen-layer assembly. It is a source-derived teaching model, not a supplied full-length manufacturing STEP.

第 11 步按用户照片修正为六条轴向连续定位梳，上、下半圆各三条。每条背骨跨越全部十四层，十三个内部梳齿对应十三处层间；整机为六条完整组件、七十八处内部梳齿接触。材料清单按完整定位梳组件计数。

Each illustrated comb has three axial sections covering 5/4/5 layers. Their lengths are 181/152/181 mm, making a 514 mm assembled backbone. Butt seams lie at Z = +77 and −75 mm in the displayed assembly frame. The seam crosses a shared tooth as two 9 mm halves, avoiding an 18 mm overlap. The illustrated sections, seams and radial seating sequence do not establish a production cut list, joining hardware or verified joining procedure. Short physical sections must be joined according to an approved mechanical design.

每条教学定位梳由三段沿轴向端对端接成，分别覆盖 5／4／5 层，长度为 181／152／181 mm，整条为 514 mm。接缝位于展示坐标 Z = +77、−75 mm，接缝梳齿由相邻两段各保留 9 mm，避免两片 18 mm 齿相互重叠。该分段与连接方式是教学示意，不能作为已核定的切割或连接制造方案。

The thirteen tooth contacts use nominal housing-to-cap gaps of 18 mm at Z centres 229 − 38i mm for i=0…12. These differ from the 26 mm magnet-face gaps. Six mounting stations maintain three combs on each semicircle and allow clearance adjustments around the supports and frame. The full backbone, teeth, seams and installation approach must be checked against nearby geometry. The animation does not certify manufacturing allowance, joining strength or physical clamping force.

六处安装位置为避让布置，上、下半圆各三条，不声称严格六等分。应逐条检查连续背骨、全部梳齿、接缝及装入路径与支撑、框架、盖板和螺杆的间隙。18 mm 为名义层间配合，制造公差及连接工艺需结合实物核定。

The two CAD downloads are kept byte-for-byte as supplied:

| Download | SHA-256 |
| --- | --- |
| Final.step | 1f15738912bae235e508296b7331f9fe8f77b38640c4633b7e15cf7aa106e3fe |
| comb-device.step | 07f7ef3f60a37d27adb3a91d31e4900f6cc36c78f33a389861a7b2314acd003e |

Final.step contains the supplied assembly, with no identified comb instance. The separate comb STEP is therefore downloadable alongside it. Participants can inspect the source CAD and prepare their own print jobs. The previous four 3MF downloads and their time table are withdrawn from the website; original engineering files are preserved. The resource-refresh policy cannot republish the retired batches or silently replace a checked CAD download with an unreviewed source draft.

两份 CAD 文件保持原始字节。Final.step 不被宣称已经包含后来单独提供的梳状件，因此两份 STEP 均可下载。旧的四份 3MF 网页副本和打印时长表已撤下，原始工程文件保留。MATLAB 教学下载继续标记待更新。

Progress version 6 preserves the selected layer, current stage and unrelated completed stages. Version 5 participants only repeat the corrected continuous-comb inspection; their frame-bolting completion remains valid. Version 4 records still require the frame-fastening and comb inspections introduced later. Playback does not mark the physical build complete. Models must be loaded before Play or Replay becomes available.

Renderer cleanup now releases per-viewer CAD clones and retired WebGL contexts while retaining the reusable CPU cache. Opening and closing a part viewer must leave its paused parent intact; repeatedly switching teaching sections must keep the Lab model available.
