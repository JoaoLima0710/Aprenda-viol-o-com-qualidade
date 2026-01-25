# Script para copiar samples de acordes do diretório "Gimme All Your Chords"
# para client/public/samples/chords/ com nomes corretos

$sourceDir = "C:\Users\Joao\Desktop\Gimme All Your Chords (Vol. 1)\Gimme All Your Chords (Vol. 1)"
$targetDir = "client\public\samples\chords"

# Mapeamento de nomes de acordes
$chordMapping = @{
    # Acordes maiores básicos
    "C" = "C"
    "D" = "D"
    "E" = "E"
    "F" = "F"
    "G" = "G"
    "A" = "A"
    "B" = "B"
    # Acordes menores
    "Amin" = "Am"
    "Bmin" = "Bm"
    "Cmin" = "Cm"
    "Dmin" = "Dm"
    "Emin" = "Em"
    "Fmin" = "Fm"
    "Gmin" = "Gm"
    # Acordes com sétima
    "A7" = "A7"
    "B7" = "B7"
    "C7" = "C7"
    "D7" = "D7"
    "E7" = "E7"
    "F7" = "F7"
    "G7" = "G7"
    # Acordes com sustenidos - maiores
    "C#" = "C#"
    "D#" = "D#"
    "F#" = "F#"
    "G#" = "G#"
    "A#" = "A#"
    # Acordes com sustenidos - menores
    "C#min" = "C#m"
    "D#min" = "D#m"
    "F#min" = "F#m"
    "G#min" = "G#m"
    "A#min" = "A#m"
    # Acordes com sustenidos - sétima
    "C#7" = "C#7"
    "D#7" = "D#7"
    "F#7" = "F#7"
    "A#7" = "A#7"
}

# Função para normalizar nome de acorde com sustenido para nome de arquivo
function Normalize-ChordName {
    param([string]$chordName)
    
    # Substituir # por sharp para nomes de arquivo
    $normalized = $chordName -replace '#', 'sharp'
    return $normalized
}

# Verificar se diretório de origem existe
if (-not (Test-Path $sourceDir)) {
    Write-Host "ERRO: Diretório de origem não encontrado: $sourceDir" -ForegroundColor Red
    exit 1
}

# Criar diretório de destino se não existir
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "Criado diretório: $targetDir" -ForegroundColor Green
}

Write-Host "`nVerificando arquivos MIDI no diretório de origem..." -ForegroundColor Yellow
Write-Host "NOTA: Arquivos MIDI precisam ser convertidos para MP3/WAV antes de usar." -ForegroundColor Yellow
Write-Host "`nOs arquivos .wav existentes em $targetDir serão mantidos." -ForegroundColor Cyan

# Verificar arquivos MIDI disponíveis
$midiFiles = Get-ChildItem -Path $sourceDir -Recurse -Filter "*.mid" | Where-Object { $_.Name -notmatch '\.DS_Store' }

if ($midiFiles.Count -eq 0) {
    Write-Host "`nNenhum arquivo MIDI encontrado no diretório de origem." -ForegroundColor Yellow
} else {
    Write-Host "`nEncontrados $($midiFiles.Count) arquivos MIDI." -ForegroundColor Cyan
    Write-Host "`nPara converter MIDI para MP3, você precisa:" -ForegroundColor Yellow
    Write-Host "1. Instalar FluidSynth (https://www.fluidsynth.org/)" -ForegroundColor White
    Write-Host "2. Instalar Python: pip install midi2audio" -ForegroundColor White
    Write-Host "3. Executar: python convert_midi_to_mp3.py" -ForegroundColor White
}

# Verificar arquivos .wav existentes no destino
$existingWav = Get-ChildItem -Path $targetDir -Filter "*.wav"
Write-Host "`nArquivos .wav existentes no destino: $($existingWav.Count)" -ForegroundColor Cyan

Write-Host "`n✅ Script concluído. Os arquivos .wav existentes serão usados." -ForegroundColor Green
Write-Host "O ChordPlayer agora tenta .mp3 primeiro, depois .wav como fallback." -ForegroundColor Green
