import { SwaggerCustomOptions } from "@nestjs/swagger";

export class SwaggerCustomTypes {
  static customSwagger(): SwaggerCustomOptions {
    const options: SwaggerCustomOptions = {
      customSiteTitle: 'Elrond API',
      customCss: `.topbar-wrapper img 
            {
              content:url(\'/img/customElrondLogo.png\'); width:250px; height:auto;
            }
            .swagger-ui .topbar { background-color: #FAFAFA; }
            .swagger-ui .scheme-container {background-color: #FAFAFA;}`,


      customfavIcon: '/img/customElrondFavIcon.png',
      swaggerOptions: {
        filter: true,
        displayRequestDuration: true,
      },
    };
    return options;
  }
}
