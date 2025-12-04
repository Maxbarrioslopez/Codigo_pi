/**
 * Servicio de impresión de tickets
 * Maneja la impresión de tickets con formato específico
 */

export interface TicketPrintData {
    uuid: string;
    trabajador: {
        nombre: string;
        rut: string;
    };
    qr_image: string;
    ttl_expira_at: string;
    estado: string;
    created_at: string;
    sucursal?: string;
}

export const printService = {
    /**
     * Imprime un ticket con formato específico
     */
    printTicket: (ticketData: TicketPrintData) => {
        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor habilite las ventanas emergentes para imprimir');
            return;
        }

        // Formatear fecha de expiración
        const expirationDate = new Date(ticketData.ttl_expira_at);
        const formattedExpiration = expirationDate.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Formatear fecha de creación
        const createdDate = new Date(ticketData.created_at);
        const formattedCreated = createdDate.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // HTML para impresión
        const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket - ${ticketData.uuid}</title>
        <style>
          @media print {
            @page { 
              margin: 0; 
              size: 80mm auto;
            }
            body { 
              margin: 0;
              padding: 0;
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            padding: 10mm;
            background: white;
          }
          
          .ticket {
            width: 60mm;
            margin: 0 auto;
            border: 2px dashed #000;
            padding: 5mm;
            text-align: center;
          }
          
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 3mm;
            margin-bottom: 3mm;
          }
          
          h1 {
            font-size: 18px;
            margin-bottom: 2mm;
            font-weight: bold;
          }
          
          .subtitle {
            font-size: 10px;
            color: #666;
          }
          
          .qr-code {
            margin: 5mm 0;
            padding: 3mm;
            background: white;
          }
          
          .qr-code img {
            max-width: 40mm;
            height: auto;
            border: 1px solid #ddd;
          }
          
          .info {
            text-align: left;
            font-size: 11px;
            line-height: 1.6;
            margin-top: 3mm;
            border-top: 1px solid #ddd;
            padding-top: 3mm;
          }
          
          .info-row {
            margin-bottom: 2mm;
            display: flex;
            justify-content: space-between;
          }
          
          .label {
            font-weight: bold;
            margin-right: 2mm;
          }
          
          .value {
            text-align: right;
            word-break: break-all;
          }
          
          .estado {
            display: inline-block;
            padding: 1mm 3mm;
            border-radius: 2mm;
            font-weight: bold;
            font-size: 10px;
            margin-top: 2mm;
          }
          
          .estado.pendiente {
            background: #fff3cd;
            color: #856404;
          }
          
          .estado.entregado {
            background: #d4edda;
            color: #155724;
          }
          
          .footer {
            margin-top: 5mm;
            padding-top: 3mm;
            border-top: 2px solid #000;
            font-size: 9px;
            color: #666;
          }
          
          .important {
            margin-top: 3mm;
            padding: 2mm;
            background: #f8f9fa;
            border-left: 3px solid #dc3545;
            font-size: 9px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>TICKET DE RETIRO</h1>
            <div class="subtitle">Sistema Tótem</div>
          </div>
          
          <div class="qr-code">
            <img src="${ticketData.qr_image}" alt="Código QR" />
          </div>
          
          <div class="info">
            <div class="info-row">
              <span class="label">Trabajador:</span>
              <span class="value">${ticketData.trabajador.nombre}</span>
            </div>
            <div class="info-row">
              <span class="label">RUT:</span>
              <span class="value">${ticketData.trabajador.rut}</span>
            </div>
            ${ticketData.sucursal ? `
            <div class="info-row">
              <span class="label">Sucursal:</span>
              <span class="value">${ticketData.sucursal}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Creado:</span>
              <span class="value">${formattedCreated}</span>
            </div>
            <div class="info-row">
              <span class="label">Expira:</span>
              <span class="value">${formattedExpiration}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <span class="estado ${ticketData.estado}">${ticketData.estado.toUpperCase()}</span>
          </div>
          
          <div class="important">
            ⚠️ <strong>IMPORTANTE:</strong> Este ticket tiene validez limitada. 
            Debe ser canjeado antes de la fecha de expiración.
          </div>
          
          <div class="footer">
            <div>UUID: ${ticketData.uuid.substring(0, 8)}...</div>
            <div style="margin-top: 2mm;">
              Presente este ticket en portería para retirar su beneficio
            </div>
          </div>
        </div>
        
        <script>
          // Imprimir automáticamente al cargar
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // Cerrar ventana después de imprimir (opcional)
              setTimeout(() => {
                window.close();
              }, 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

        printWindow.document.write(html);
        printWindow.document.close();
    },

    /**
     * Imprime la página actual usando window.print()
     */
    printCurrentPage: () => {
        window.print();
    }
};

export default printService;
