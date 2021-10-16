#include "RCSwitch.h"
#include <stdlib.h>
#include <stdio.h>
#include <time.h>


RCSwitch mySwitch;



int main(int argc, char *argv[]) {

     // This pin is not the first pin on the RPi GPIO header!
     // Consult https://projects.drogon.net/raspberry-pi/wiringpi/pins/
     // for more information.
     int PIN = 2;
     int tests = 0;
     int maxTests = 10;
     int maxSeconds = 10;

     if(wiringPiSetup() == -1)
       return 0;

     mySwitch = RCSwitch();
     mySwitch.enableReceive(PIN);  // Receiver on inerrupt 0 => that is pin #2

     clock_t timeStart = clock();
     while(tests < maxTests) {

      if ((clock() - timeStart) / CLOCKS_PER_SEC >= maxSeconds) // time in seconds
             break;

      if (mySwitch.available()) {

        int value = mySwitch.getReceivedValue();

        if (value == 0) {
             printf("Unknown encoding");
        } else {
             printf("Received %i\n", mySwitch.getReceivedValue() );
             //Show pulse(Depends on your RF outlet device. You may need to change the pulse on codesend.cpp)
	       printf("Received pulse %i\n", mySwitch.getReceivedDelay() );
        }
          tests++;
        mySwitch.resetAvailable();

      }


  }

  exit(0);


}
