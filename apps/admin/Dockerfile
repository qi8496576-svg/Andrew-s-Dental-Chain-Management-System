ARG NGINX_RUNTIME=nginxinc/nginx-unprivileged@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
FROM ${NGINX_RUNTIME}
COPY --chown=101:101 dist/ /usr/share/nginx/html/
COPY --chown=101:101 deploy/nginx.conf.template /etc/nginx/adc.conf.template
USER 101:101
EXPOSE 8443
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 CMD ["wget","-q","-O","/dev/null","http://127.0.0.1:8081/live"]
ENTRYPOINT ["/bin/sh","-ec"]
CMD ["envsubst '$ADC_DOMAIN' < /etc/nginx/adc.conf.template > /tmp/nginx.conf; exec nginx -c /tmp/nginx.conf -g 'daemon off;'"]
