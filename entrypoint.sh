#!/bin/sh
# ENV VARIABLES 
  # MVX_ENV             - defines what config to copy (default devnet)  
  # ELASTICSEARCH_URL   - defines custom elasticsearch url - eg https://devnet-index.multiversx.com
  # GATEWAY_URL         - defines custom gateway url - eg https://devnet-gateway.multiversx.com
  # REDIS_IP            - defines redis ip - default 127.0.0.1 

# CHECK IF ENV IS DEFINED
if [ -n "$MVX_ENV" ] && [ "$MVX_ENV" = "devnet" ]; then
    # Copy config file
    cp ./config/config.${MVX_ENV}.yaml /app/dist/config/config.yaml

    if [ $? -eq 0 ]; then
        echo "Config file copied successfully from config/config.${MVX_ENV}.yaml /app/dist/config/config.yaml"
    else
        echo "Failed to copy the file."
    fi

else
    cp ./config/config.devnet.yaml /app/dist/config/config.yaml

    if [ $? -eq 0 ]; then
        echo "Default config file copied successfully from config/config.devnet.yaml /app/dist/config/config.yaml"
    else
        echo "Failed to copy the file."
    fi  
fi

# Replaces urls if defined
if [ -n "$REDIS_IP" ]; then
  echo "Redis IP defined: ${REDIS_IP}, replacing in config"
  sed -i "s|redis: '127.0.0.1'|redis: '${REDIS_IP}'|g" /app/dist/config/config.yaml
fi

if [ -n "$ELASTICSEARCH_URL" ]; then
  echo "Elasticsearch url defined: ${ELASTICSEARCH_URL}, replacing in config"
  sed -i "/^  elastic:/!b; n; s|.*|    - '${ELASTICSEARCH_URL}'|" /app/dist/config/config.yaml
fi

if [ -n "$GATEWAY_URL" ]; then
  echo "Gateway url defined: ${GATEWAY_URL}, replacing in config"
  sed -i "/^  gateway:/!b; n; s|.*|    - '${GATEWAY_URL}'|" /app/dist/config/config.yaml
fi


exec /usr/local/bin/node dist/src/main.js
