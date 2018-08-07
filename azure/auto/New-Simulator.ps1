param(
    [parameter(Mandatory=$true)]
    $ResourceGroup,
    [parameter(Mandatory=$true)]
    $ContainerName
)

Import-Module './SimulatorModule'

Login
if( (Test-Container -ResourceGroupName $ResourceGroup -Name $ContainerName ) -eq $true)
{
    Write-Warning "$ContainerName exists in $ResourceGroup."
    return
}

New-AzureRmContainerGroup -ResourceGroupName $ResourceGroup -Name $ContainerName -Image sairamaj/servicesimulator:v1 -DnsNameLabel $ContainerName | Out-Null
Write-Host "$ContainerName created. Checking the status."

# Check the container status periodically for success status
do{
    Write-Host 'Checking ....'
    $container = Get-AzureRmContainerGroup -ResourceGroupName $ResourceGroup -Name $ContainerName
    Write-Progress "$ContainerName is in  $($container.State)"
    
    if( $container.State -eq 'Running'){
        break
    }

    Start-Sleep -Seconds 10
}while($true)


Write-Host "Verifying..."
Test-SimulatorHost $container.Fqdn
