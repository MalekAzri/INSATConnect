iwr https://fly.io/install.ps1 -useb | iex
$env:PATH += ";C:\Users\malek\.fly\bin"
fly.exe auth login