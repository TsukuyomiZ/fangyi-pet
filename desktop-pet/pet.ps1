# Zhuang Fangyi desktop pet: shows what each Claude Code session is doing.
# Each session's state comes from the fangyi-pet mod, one JSON file per session
# in ~/.claude/desktop-pet/sessions. Left-click her to mark finished sessions as
# seen; drag to move; right-click for the menu.
# -Snapshot <png> draws one frame to that file and exits (for checking the look).

param([string]$Snapshot)

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $env:USERPROFILE '.claude\desktop-pet'
$sessionsDir = Join-Path $dataDir 'sessions'
$positionFile = Join-Path $dataDir 'position.txt'
New-Item -ItemType Directory -Force $sessionsDir | Out-Null

# One pet at a time.
$isFirst = $false
$script:mutex = [System.Threading.Mutex]::new($true, 'Local\ClaudeDesktopPetFangyi', [ref]$isFirst)
if (-not $isFirst -and -not $Snapshot) { exit }

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="莊芳宜" WindowStyle="None" AllowsTransparency="True" Background="Transparent"
        Topmost="True" ShowInTaskbar="False" SizeToContent="WidthAndHeight" ResizeMode="NoResize">
  <StackPanel>
    <Border x:Name="Bubble" Background="#F5FFFFFF" BorderBrush="#C8D400" BorderThickness="1.5"
            CornerRadius="10" Padding="10,6" Margin="0,0,0,2" MaxWidth="280" MinWidth="150"
            HorizontalAlignment="Center" Visibility="Collapsed">
      <StackPanel x:Name="Rows"/>
    </Border>
    <Image x:Name="Pet" Width="130" Height="181" HorizontalAlignment="Center" Cursor="Hand"
           RenderOptions.BitmapScalingMode="HighQuality"/>
  </StackPanel>
</Window>
'@
$window = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xaml))
$bubble = $window.FindName('Bubble')
$rows = $window.FindName('Rows')
$pet = $window.FindName('Pet')

function Load-Pose([string]$name) {
  $b = New-Object System.Windows.Media.Imaging.BitmapImage
  $b.BeginInit()
  $b.UriSource = New-Object System.Uri (Join-Path $root "poses\$name.png")
  $b.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
  $b.EndInit()
  $b.Freeze()
  $b
}
$poses = @{}
foreach ($p in 'idle', 'thinking', 'working', 'speaking', 'done', 'waiting') { $poses[$p] = Load-Pose $p }

# How each state is shown: its label, colour, and order in the list.
$look = @{
  waiting   = @{ text = '等你確認'; color = '#D9363E'; rank = 0 }
  done      = @{ text = '跑好了 ✓'; color = '#4E9A2A'; rank = 1 }
  working   = @{ text = '工作中';   color = '#C49A2C'; rank = 2 }
  answering = @{ text = '回答中';   color = '#3A8FD9'; rank = 3 }
  thinking  = @{ text = '思考中';   color = '#8A8F99'; rank = 4 }
}

$script:seen = @{}      # session id -> updatedAt of the 'done' already seen
$script:prev = @{}      # session id -> state at the last poll
$script:firstPoll = $true

function Read-Sessions {
  $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $list = @()
  foreach ($f in Get-ChildItem -LiteralPath $sessionsDir -Filter *.json -ErrorAction SilentlyContinue) {
    try { $s = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } catch { continue }
    $stale = ($now - [double]$s.updatedAt) -gt 86400000
    if ($s.state -eq 'ended' -or $stale) {
      Remove-Item -LiteralPath $f.FullName -ErrorAction SilentlyContinue
      continue
    }
    $list += $s
  }
  , $list
}

function Is-Unseen($s) { $s.state -eq 'done' -and $script:seen[$s.id] -ne $s.updatedAt }

function Mark-Seen($s) { $script:seen[$s.id] = $s.updatedAt }

function Label($s) {
  if ($s.folder -and $s.prompt) { return "$($s.folder) · $($s.prompt)" }
  if ($s.folder) { return $s.folder }
  if ($s.prompt) { return $s.prompt }
  return '(新的 session)'
}

function Refresh {
  $sessions = Read-Sessions
  $shown = @()
  $chime = $false
  foreach ($s in $sessions) {
    $was = $script:prev[$s.id]
    if ($s.state -eq 'done' -and $was -and $was -ne 'done' -and -not $script:firstPoll) { $chime = $true }
    $script:prev[$s.id] = $s.state
    if ($s.state -eq 'done' -and -not (Is-Unseen $s)) { continue }
    if ($look.ContainsKey($s.state)) { $shown += $s }
  }
  $script:firstPoll = $false
  if ($chime) { [System.Media.SystemSounds]::Asterisk.Play() }

  $states = $shown | ForEach-Object { $_.state }
  $pose = 'idle'
  if ($states -contains 'waiting') { $pose = 'waiting' }
  elseif ($states -contains 'done') { $pose = 'done' }
  elseif ($states -contains 'working') { $pose = 'working' }
  elseif ($states -contains 'answering') { $pose = 'speaking' }
  elseif ($states -contains 'thinking') { $pose = 'thinking' }
  $pet.Source = $poses[$pose]

  $rows.Children.Clear()
  foreach ($s in ($shown | Sort-Object { $look[$_.state].rank }, { $_.folder })) {
    $l = $look[$s.state]
    $brush = (New-Object System.Windows.Media.BrushConverter).ConvertFromString($l.color)

    $row = New-Object System.Windows.Controls.DockPanel
    $row.Margin = '0,2,0,2'
    $row.Tag = $s
    $row.Cursor = [System.Windows.Input.Cursors]::Hand
    $row.Background = [System.Windows.Media.Brushes]::Transparent
    $row.ToolTip = '點一下標為已看'

    $dot = New-Object System.Windows.Shapes.Ellipse
    $dot.Width = 8; $dot.Height = 8; $dot.Fill = $brush; $dot.Margin = '0,0,6,0'
    $dot.VerticalAlignment = 'Center'
    [System.Windows.Controls.DockPanel]::SetDock($dot, 'Left')

    $status = New-Object System.Windows.Controls.TextBlock
    $status.Text = $l.text; $status.Foreground = $brush; $status.FontWeight = 'Bold'
    $status.Margin = '8,0,0,0'; $status.FontSize = 12
    [System.Windows.Controls.DockPanel]::SetDock($status, 'Right')

    $name = New-Object System.Windows.Controls.TextBlock
    $name.Text = Label $s; $name.FontSize = 12; $name.Foreground = [System.Windows.Media.Brushes]::DimGray
    $name.TextTrimming = 'CharacterEllipsis'; $name.MaxWidth = 180

    [void]$row.Children.Add($dot)
    [void]$row.Children.Add($status)
    [void]$row.Children.Add($name)
    $row.Add_MouseLeftButtonDown({
        param($sender, $e)
        Mark-Seen $sender.Tag
        $e.Handled = $true
        Refresh
      })
    [void]$rows.Children.Add($row)
  }
  $bubble.Visibility = if ($rows.Children.Count -gt 0) { 'Visible' } else { 'Collapsed' }
}

function Mark-AllSeen {
  foreach ($s in (Read-Sessions)) { if ($s.state -eq 'done') { Mark-Seen $s } }
  Refresh
}

# Drag to move; a click that does not move her marks finished sessions as seen.
$window.Add_MouseLeftButtonDown({
    $left = $window.Left; $top = $window.Top
    try { $window.DragMove() } catch {}
    if ([math]::Abs($window.Left - $left) -lt 3 -and [math]::Abs($window.Top - $top) -lt 3) { Mark-AllSeen }
    else { Save-Position }
  })

# Keep her feet where they are while the bubble above grows and shrinks.
$window.Add_SizeChanged({
    param($sender, $e)
    if ($e.PreviousSize.Height -gt 0) {
      $window.Top += $e.PreviousSize.Height - $e.NewSize.Height
      $window.Left += ($e.PreviousSize.Width - $e.NewSize.Width) / 2
    }
  })

$menu = New-Object System.Windows.Controls.ContextMenu
$itemSeen = New-Object System.Windows.Controls.MenuItem
$itemSeen.Header = '全部標為已看'
$itemSeen.Add_Click({ Mark-AllSeen })
$itemQuit = New-Object System.Windows.Controls.MenuItem
$itemQuit.Header = '關閉桌寵'
$itemQuit.Add_Click({ $window.Close() })
[void]$menu.Items.Add($itemSeen)
[void]$menu.Items.Add($itemQuit)
$window.ContextMenu = $menu

# Where her feet are (the window's bottom centre), kept across restarts.
function Save-Position {
  $x = $window.Left + $window.ActualWidth / 2
  $y = $window.Top + $window.ActualHeight
  try { Set-Content -LiteralPath $positionFile -Value "$x,$y" -Encoding ASCII } catch {}
}

$window.Add_Loaded({
    $area = [System.Windows.SystemParameters]::WorkArea
    $x = $area.Right - $window.ActualWidth / 2 - 24
    $y = $area.Bottom - 8
    if (Test-Path -LiteralPath $positionFile) {
      $saved = (Get-Content -LiteralPath $positionFile -Raw).Trim() -split ','
      $sx = [double]$saved[0]; $sy = [double]$saved[1]
      $vs = [System.Windows.SystemParameters]
      $onScreen = $sx -ge $vs::VirtualScreenLeft -and $sx -le $vs::VirtualScreenLeft + $vs::VirtualScreenWidth -and
        $sy -ge $vs::VirtualScreenTop -and $sy -le $vs::VirtualScreenTop + $vs::VirtualScreenHeight
      if ($onScreen) { $x = $sx; $y = $sy }
    }
    $window.Left = $x - $window.ActualWidth / 2
    $window.Top = $y - $window.ActualHeight
  })

if ($Snapshot) {
  $window.Add_ContentRendered({
      $c = $window.Content
      $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap ([int]($c.ActualWidth * 2)), ([int]($c.ActualHeight * 2)), 192, 192, ([System.Windows.Media.PixelFormats]::Pbgra32)
      $rtb.Render($c)
      $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
      $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
      $out = [IO.File]::Create($Snapshot); $enc.Save($out); $out.Close()
      $window.Close()
    })
}

$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromMilliseconds(800)
$timer.Add_Tick({ Refresh })

Refresh
$timer.Start()
[void]$window.ShowDialog()
if ($isFirst) { $script:mutex.ReleaseMutex() }
